"use client";

import type { TypedSocket } from "./index";
import type { IncomingSignal, ChatMessage } from "@/network/events";
import { RoomManager, type RoomManagerState } from "./RoomManager";
import { PeerManager, type PeerStatus, type PeerManagerConfig } from "./PeerManager";
import { ChatManager } from "./ChatManager";

export interface OrchestratorState extends RoomManagerState {
  peerStatus: PeerStatus;
  messages: ChatMessage[];
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
};

export class RoomOrchestrator {
  private roomManager: RoomManager;
  private peerManager: PeerManager | null = null;
  private chatManager: ChatManager | null = null;
  private _state: OrchestratorState = { ...INITIAL_STATE };
  private stateListeners = new Set<StateListener>();
  private cleanupFns: (() => void)[] = [];
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

  start(roomId: string, username: string) {
    this.username = username;

    this.roomManager.attach();
    this.cleanupFns.push(
      this.roomManager.subscribe(() => this.onRoomChange())
    );

    this.socket.on("signal", this.onIncomingSignal);

    this.roomManager.join(roomId, username);
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

    if (rs.isJoined && rs.players.length >= 2 && !this.peerManager) {
      this.initiatePeer();
    }

    if (rs.isJoined && rs.players.length < 2 && this.peerManager) {
      this.teardownPeer();
    }
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

    this.cleanupFns.push(
      this.peerManager.onStatusChange(() => this.onPeerChange())
    );

    this.peerManager.connect();
    this.setState({ peerStatus: "connecting" });
  }

  private onPeerChange() {
    if (!this.peerManager) return;

    const peerStatus = this.peerManager.status;
    this.setState({ peerStatus });

    if (peerStatus === "connected" && !this.chatManager) {
      this.chatManager = new ChatManager(this.peerManager, this.username);
      this.chatManager.attach();
      this.cleanupFns.push(
        this.chatManager.subscribe(() => {
          this.setState({ messages: this.chatManager?.messages ?? [] });
        })
      );
      this.setState({ messages: this.chatManager.messages });
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

  private teardownPeer() {
    this.chatManager?.destroy();
    this.chatManager = null;
    this.peerManager?.destroy();
    this.peerManager = null;
    this.setState({ peerStatus: "idle", messages: [] });
  }

  sendChat(text: string) {
    this.chatManager?.sendMessage(text);
  }

  destroy() {
    this.socket.off("signal", this.onIncomingSignal);
    this.chatManager?.destroy();
    this.peerManager?.destroy();
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.roomManager.destroy();
    this.stateListeners.clear();
  }
}
