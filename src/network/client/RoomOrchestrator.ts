"use client";

import type { TypedSocket } from "./index";
import type { IncomingSignal, ChatMessage, StrokeData } from "@/network/events";
import { RoomManager, type RoomManagerState } from "./RoomManager";
import { PeerManager, type PeerStatus, type PeerManagerConfig } from "./PeerManager";
import { ChatManager } from "./ChatManager";

export interface OrchestratorState extends RoomManagerState {
  peerStatus: PeerStatus;
  messages: ChatMessage[];
  strokes: StrokeData[];
}

export type StateListener = () => void;

const INITIAL_STATE: OrchestratorState = {
  players: [],
  hostId: null,
  myId: null,
  isJoined: false,
  error: null,
  isConnected: false,
  peerStatus: "idle",
  messages: [],
  strokes: [],
};

export class RoomOrchestrator {
  private roomManager: RoomManager;
  private peerManager: PeerManager | null = null;
  private chatManager: ChatManager | null = null;
  private _state: OrchestratorState = { ...INITIAL_STATE };
  private stateListeners = new Set<StateListener>();
  private cleanupFns: (() => void)[] = [];
  private unsubStrokeData: (() => void) | null = null;
  private unsubPeerStatus: (() => void) | null = null;
  private snapshotSent = false;
  private peerRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private socket: TypedSocket;
  private username: string = "";

  constructor(socket: TypedSocket) {
    this.socket = socket;
    this.roomManager = new RoomManager(socket);
  }

  get state(): OrchestratorState {
    return this._state;
  }

  subscribe(cb: StateListener): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  private setState(partial: Partial<OrchestratorState>) {
    this._state = { ...this._state, ...partial };
    this.stateListeners.forEach((cb) => cb());
  }

  private clearPeerRetryTimer() {
    if (this.peerRetryTimer) {
      clearTimeout(this.peerRetryTimer);
      this.peerRetryTimer = null;
    }
  }

  private resetPeerChannel() {
    this.unsubStrokeData?.();
    this.unsubStrokeData = null;
    this.unsubPeerStatus?.();
    this.unsubPeerStatus = null;
    this.chatManager?.destroy();
    this.chatManager = null;
    this.peerManager?.destroy();
    this.peerManager = null;
    this.snapshotSent = false;
    this.setState({ peerStatus: "idle" });
  }

  private async retryWithVerification() {
    this.peerRetryTimer = null;
    const { isJoined, players } = this.roomManager.state;
    if (this.peerManager || !isJoined || players.length < 2) return;

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const statusPromise = this.roomManager.requestRoomStatus();
    await Promise.race([statusPromise, timeout]);

    const { isJoined: stillJoined, players: currentPlayers } = this.roomManager.state;
    if (this.peerManager || !stillJoined || currentPlayers.length < 2) return;

    this.initiatePeer();
  }

  private schedulePeerRetry() {
    if (this.peerRetryTimer) return;

    this.peerRetryTimer = setTimeout(() => {
      this.retryWithVerification();
    }, 1000);
  }

  start(roomId: string, username: string, password?: string) {
    this.username = username;

    this.roomManager.attach();
    this.cleanupFns.push(
      this.roomManager.subscribe(() => this.onRoomChange())
    );

    this.socket.on("signal", this.onIncomingSignal);
    this.socket.on("hostChanged", this.onHostChanged);

    this.roomManager.join(roomId, username, password);
  }

  private onRoomChange() {
    const rs = this.roomManager.state;

    this.setState({
      players: rs.players,
      hostId: rs.hostId,
      myId: rs.myId,
      isJoined: rs.isJoined,
      error: rs.error,
      isConnected: rs.isConnected,
    });

    if (!rs.isJoined) {
      if (this.peerManager) {
        this.teardownPeer();
      }
      return;
    }

    if (rs.players.length >= 2 && !this.peerManager) {
      this.initiatePeer();
    }

    if (rs.players.length < 2 && this.peerManager) {
      this.teardownPeer();
    }
  }

  private applyCanvasEvent(
    event:
      | { type: "stroke"; payload: StrokeData }
      | { type: "snapshot"; payload: { strokes: StrokeData[]; timestamp: number; playerId: string } }
      | { type: "undo"; payload: { playerId: string; timestamp: number } }
      | { type: "clear"; payload: { playerId: string; timestamp: number } },
  ) {
    if (event.type === "stroke") {
      this.setState({ strokes: [...this._state.strokes, event.payload] });
      return;
    }

    if (event.type === "snapshot") {
      this.setState({ strokes: event.payload.strokes });
      return;
    }

    if (event.type === "undo") {
      this.setState({ strokes: this._state.strokes.slice(0, -1) });
      return;
    }

    this.setState({ strokes: [] });
  }

  private initiatePeer() {
    const { players, hostId, myId } = this.roomManager.state;
    if (!myId || !hostId) return;

    const isHost = myId === hostId;
    const otherPlayer = players.find((p) => p.id !== myId);
    if (!otherPlayer) return;

    const targetPeerId = isHost ? otherPlayer.id : hostId;

    console.log(
      "[Orchestrator] initiating peer — isHost:", isHost,
      "myId:", myId, "target:", targetPeerId
    );

    const iceServers: RTCIceServer[] =
      process.env.NODE_ENV === "production"
        ? [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
          ]
        : [];

    const config: PeerManagerConfig = {
      initiator: isHost,
      targetPeerId,
      iceServers,
      signalRelay: (id, signal) => {
        console.log("[Orchestrator] relaying signal to", id);
        this.socket.emit("signal", { targetId: id, signal });
      },
    };

    this.peerManager = new PeerManager(config);

    this.unsubStrokeData = this.peerManager.onData((raw: string) => {
      try {
        const msg = JSON.parse(raw);
        if (
          msg.type === "stroke" ||
          msg.type === "snapshot" ||
          msg.type === "undo" ||
          msg.type === "clear"
        ) {
          this.applyCanvasEvent(msg);
        }
      } catch {
        // ignore malformed messages
      }
    });

    this.unsubPeerStatus?.();
    this.unsubPeerStatus = this.peerManager.onStatusChange(() => this.onPeerChange());

    this.peerManager.connect();
    this.setState({ peerStatus: "connecting" });
  }

  private onPeerChange() {
    if (!this.peerManager) return;

    const peerStatus = this.peerManager.status;
    this.setState({ peerStatus });

    if (peerStatus === "connected") {
      this.clearPeerRetryTimer();
    }

    if (peerStatus !== "connected") {
      this.snapshotSent = false;
    }

    if (peerStatus === "disconnected" || peerStatus === "error") {
      const shouldRetry = this.roomManager.state.isJoined && this.roomManager.state.players.length >= 2;
      this.resetPeerChannel();
      if (shouldRetry) {
        this.schedulePeerRetry();
      }
      return;
    }

    if (peerStatus === "connected" && !this.chatManager) {
      this.chatManager = new ChatManager(this.peerManager, this.username, this._state.messages);
      this.chatManager.attach();
      this.cleanupFns.push(
        this.chatManager.subscribe(() => {
          this.setState({ messages: this.chatManager?.messages ?? [] });
        })
      );
      this.setState({ messages: this.chatManager.messages });
    }

    if (peerStatus === "connected" && !this.snapshotSent) {
      const { myId, hostId } = this.roomManager.state;
      const isHost = !!myId && !!hostId && myId === hostId;
      if (isHost) {
        this.snapshotSent = true;
        const envelope = {
          type: "snapshot",
          payload: {
            playerId: this.username,
            timestamp: Date.now(),
            strokes: this._state.strokes,
          },
        };
        this.peerManager.send(JSON.stringify(envelope));
      }
    }

  }

  private onIncomingSignal = (data: IncomingSignal) => {
    if (!this.peerManager) {
      console.log("[Orchestrator] signal ignored: no peerManager yet");
      return;
    }
    if (data.senderId !== this.peerManager.config.targetPeerId) {
      console.log(
        "[Orchestrator] signal ignored: senderId", data.senderId,
        "!== targetPeerId", this.peerManager.config.targetPeerId
      );
      return;
    }
    console.log("[Orchestrator] signal received from", data.senderId, "→ forwarding to peerManager");
    this.peerManager.handleSignal(data.signal);
  };

  private onHostChanged = (newHostId: string) => {
    const oldHostId = this._state.hostId;
    this.setState({ hostId: newHostId });

    if (oldHostId === newHostId || !oldHostId) return;

    const hasPeerOrRetry = this.peerManager !== null || this.peerRetryTimer !== null;
    if (!hasPeerOrRetry) return;

    this.clearPeerRetryTimer();
    this.resetPeerChannel();
  };

  private teardownPeer() {
    this.clearPeerRetryTimer();
    this.resetPeerChannel();
  }

  leaveRoom() {
    this.clearPeerRetryTimer();
    this.resetPeerChannel();
    this.roomManager.leave();
    this.socket.off("hostChanged", this.onHostChanged);
  }

  sendChat(text: string) {
    this.chatManager?.sendMessage(text);
  }

  sendStroke(stroke: StrokeData) {
    const envelope = { type: "stroke", payload: stroke };
    this.peerManager?.send(JSON.stringify(envelope));
    this.setState({ strokes: [...this._state.strokes, stroke] });
  }

  sendUndo() {
    const envelope = {
      type: "undo",
      payload: {
        playerId: this.username,
        timestamp: Date.now(),
      },
    };
    this.peerManager?.send(JSON.stringify(envelope));
    this.setState({ strokes: this._state.strokes.slice(0, -1) });
  }

  sendClear() {
    const envelope = {
      type: "clear",
      payload: {
        playerId: this.username,
        timestamp: Date.now(),
      },
    };
    this.peerManager?.send(JSON.stringify(envelope));
    this.setState({ strokes: [] });
  }

  destroy() {
    this.socket.off("signal", this.onIncomingSignal);
    this.socket.off("hostChanged", this.onHostChanged);
    this.clearPeerRetryTimer();
    this.unsubStrokeData?.();
    this.unsubStrokeData = null;
    this.unsubPeerStatus?.();
    this.unsubPeerStatus = null;
    this.chatManager?.destroy();
    this.peerManager?.destroy();
    this.snapshotSent = false;
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.roomManager.destroy();
    this.stateListeners.clear();
  }
}
