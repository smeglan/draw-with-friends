"use client";

import type { TypedSocket } from "./index";
import type {
  IncomingSignal,
  ChatMessage,
  StrokeData,
  DataChannelMessage,
  GamePhase,
} from "@/network/events";
import { RoomManager, type RoomManagerState } from "./RoomManager";
import { PeerManager, type PeerStatus, type PeerManagerConfig } from "./PeerManager";
import { ChatManager } from "./ChatManager";
import { VoteManager } from "./VoteManager";
import { ReadyManager } from "./ReadyManager";
import { GameLifecycle } from "@/game/GameLifecycle";
import type { ModeSelectionState, GameModeId } from "@/modes/types";
import type { TelephoneGameState } from "@/modes/telephone/types";
import { TelephoneManager } from "@/modes/telephone/TelephoneManager";
import type { MasterpieceGameState } from "@/modes/masterpiece/types";
import { MasterpieceManager } from "@/modes/masterpiece/MasterpieceManager";

export interface OrchestratorState extends RoomManagerState {
  peerStatus: PeerStatus;
  messages: ChatMessage[];
  strokes: StrokeData[];
  modeSelection: ModeSelectionState;
  readyPlayers: string[];
  gamePhase: GamePhase;
  telephone: TelephoneGameState;
  masterpiece: MasterpieceGameState;
}

export type StateListener = () => void;

const INITIAL_MASTERPIECE: MasterpieceGameState = {
  phase: { type: "idle" },
  prompt: "",
  submissions: [],
  submittedPlayerIds: [],
  votedPlayerIds: [],
  votes: {},
  rankings: null,
  phaseEndsAt: null,
};

const INITIAL_TELEPHONE: TelephoneGameState = {
  phase: { type: "idle" },
  currentRound: 0,
  totalRounds: 4,
  phaseEndsAt: null,
  assignedPrompt: null,
  chains: null,
  submittedPlayerIds: [],
};

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
  modeSelection: { type: "none" },
  readyPlayers: [],
  gamePhase: "lobby",
  telephone: INITIAL_TELEPHONE,
  masterpiece: INITIAL_MASTERPIECE,
};

export class RoomOrchestrator {
  private roomManager: RoomManager;
  private peerManagers: Map<string, PeerManager> = new Map();
  private pendingSignals: Map<string, unknown[]> = new Map();
  private chatManager: ChatManager | null = null;
  private voteManager: VoteManager | null = null;
  private readyManager: ReadyManager | null = null;
  private telephoneManager: TelephoneManager | null = null;
  private masterpieceManager: MasterpieceManager | null = null;
  private gameLifecycle: GameLifecycle;
  private _state: OrchestratorState = { ...INITIAL_STATE };
  private stateListeners = new Set<StateListener>();
  private cleanupFns: (() => void)[] = [];
  private peerRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private socket: TypedSocket;
  private username: string = "";

  constructor(socket: TypedSocket) {
    this.socket = socket;
    this.roomManager = new RoomManager(socket);
    this.gameLifecycle = new GameLifecycle();
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

  private derivePeerStatus(): PeerStatus {
    if (this.peerManagers.size === 0) return "idle";
    let hasConnecting = false;
    for (const pm of this.peerManagers.values()) {
      if (pm.status === "connected") return "connected";
      if (pm.status === "connecting") hasConnecting = true;
    }
    if (hasConnecting) return "connecting";
    for (const pm of this.peerManagers.values()) {
      if (pm.status === "error") return "error";
    }
    return "disconnected";
  }

  private resetPeerChannel() {
    this.chatManager?.destroy();
    this.chatManager = null;
    this.voteManager?.destroy();
    this.voteManager = null;
    this.readyManager?.destroy();
    this.readyManager = null;
    this.telephoneManager?.destroy();
    this.telephoneManager = null;
    this.masterpieceManager?.destroy();
    this.masterpieceManager = null;
    for (const pm of this.peerManagers.values()) {
      pm.destroy();
    }
    this.peerManagers.clear();
    this.pendingSignals.clear();
    this.setState({
      peerStatus: "idle",
      modeSelection: { type: "none" },
      gamePhase: "lobby",
      telephone: INITIAL_TELEPHONE,
      masterpiece: INITIAL_MASTERPIECE,
    });
  }

  private async retryWithVerification() {
    this.peerRetryTimer = null;
    const { isJoined, players } = this.roomManager.state;
    if (this.peerManagers.size > 0 || !isJoined || players.length < 2) return;

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const statusPromise = this.roomManager.requestRoomStatus();
    await Promise.race([statusPromise, timeout]);

    const { isJoined: stillJoined, players: currentPlayers } = this.roomManager.state;
    if (this.peerManagers.size > 0 || !stillJoined || currentPlayers.length < 2) return;

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
      this.roomManager.subscribe(() => this.onRoomChange()),
    );

    this.socket.on("signal", this.onIncomingSignal);
    this.socket.on("hostChanged", this.onHostChanged);

    this.roomManager.join(roomId, username, password);
  }

  private onRoomChange() {
    const rs = this.roomManager.state;
    const prevPlayers = this._state.players;

    this.setState({
      players: rs.players,
      hostId: rs.hostId,
      myId: rs.myId,
      isJoined: rs.isJoined,
      error: rs.error,
      isConnected: rs.isConnected,
    });

    if (!rs.isJoined) {
      if (this.peerManagers.size > 0) {
        this.teardownPeer();
      }
      return;
    }

    if (this._state.gamePhase === "playing") {
      for (const p of prevPlayers) {
        if (!rs.players.find((np) => np.id === p.id)) {
          this.telephoneManager?.removePlayer(p.id);
          this.masterpieceManager?.removePlayer(p.id);
        }
      }
    }

    const expectedPeers = this.getExpectedPeerIds(rs.myId, rs.hostId, rs.players);
    const currentPeers = new Set(this.peerManagers.keys());

    if (rs.players.length >= 2 && (this.peerManagers.size === 0 || this.needsMorePeers(expectedPeers, currentPeers))) {
      this.initiatePeer();
    }

    if (rs.players.length < 2 && this.peerManagers.size > 0) {
      this.teardownPeer();
    }
  }

  private getExpectedPeerIds(myId: string | null, hostId: string | null, players: { id: string }[]): string[] {
    if (!myId) return [];
    const isHost = myId === hostId;
    if (isHost) {
      return players.filter((p) => p.id !== myId).map((p) => p.id);
    }
    return hostId ? [hostId] : [];
  }

  private needsMorePeers(expected: string[], current: Set<string>): boolean {
    return expected.some((id) => !current.has(id));
  }

  private onDataReceived(senderId: string, raw: string) {
    try {
      const msg: DataChannelMessage = JSON.parse(raw);

      if (msg.type === "stroke" || msg.type === "snapshot" || msg.type === "undo" || msg.type === "clear") {
        this.applyCanvasEvent(msg);
        return;
      }

      if (msg.type === "game_start") {
        this.gameLifecycle.startGame(msg.payload.mode);
        this.setState({ gamePhase: "playing" });
        const mode = msg.payload.mode;
        const playerIds = this._state.players.map((p) => p.id);
        if (mode === "telephone") {
          this.telephoneManager?.startGame(
            mode,
            playerIds,
            (msg.payload.config?.totalRounds as number) ?? 3,
            false,
          );
        } else if (mode === "masterpiece") {
          this.masterpieceManager?.startGame(
            mode,
            playerIds,
            false,
            (msg.payload.config?.prompt as string) ?? "",
          );
        }
        return;
      }

      if (msg.type === "game_end") {
        this.gameLifecycle.endGame();
        this.setState({ gamePhase: "results" });
        return;
      }

      if (msg.type === "game_phase" && msg.payload.phase === "lobby") {
        this.gameLifecycle.restart();
        this.restartLocal();
        return;
      }

      if (msg.type === "telephone_phrase_submit" || msg.type === "telephone_drawing_submit" || msg.type === "telephone_description_submit") {
        this.telephoneManager?.handleMessage(senderId, msg);
        return;
      }

      if (msg.type === "telephone_phase" || msg.type === "telephone_assigned" || msg.type === "telephone_reveal" || msg.type === "telephone_config" || msg.type === "telephone_all_submitted") {
        this.telephoneManager?.handleMessage(senderId, msg);
        return;
      }

      if (msg.type === "masterpiece_drawing_submit" || msg.type === "masterpiece_vote_submit" || msg.type === "masterpiece_phase") {
        this.masterpieceManager?.handleMessage(senderId, msg);
        return;
      }
    } catch {
      // ignore malformed messages
    }
  }

  private setupPeerDataHandler(playerId: string, pm: PeerManager): () => void {
    return pm.onData((raw: string) => {
      this.onDataReceived(playerId, raw);
    });
  }

  private createSinglePeer(targetPeerId: string, initiator: boolean) {
    if (this.peerManagers.has(targetPeerId)) return;

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
      initiator,
      targetPeerId,
      iceServers,
      signalRelay: (id, signal) => {
        this.socket.emit("signal", { targetId: id, signal });
      },
    };

    const pm = new PeerManager(config);
    this.peerManagers.set(targetPeerId, pm);

    const unsubData = this.setupPeerDataHandler(targetPeerId, pm);
    this.cleanupFns.push(unsubData);

    const unsubStatus = pm.onStatusChange(() => this.onSinglePeerChange(targetPeerId));
    this.cleanupFns.push(unsubStatus);

    pm.connect();
    this.flushPendingSignals(targetPeerId);
    this.setState({ peerStatus: this.derivePeerStatus() });
  }

  private flushPendingSignals(targetPeerId: string) {
    const queuedSignals = this.pendingSignals.get(targetPeerId);
    const pm = this.peerManagers.get(targetPeerId);
    if (!pm || !queuedSignals || queuedSignals.length === 0) return;

    this.pendingSignals.delete(targetPeerId);
    for (const signal of queuedSignals) {
      pm.handleSignal(signal);
    }
  }

  private onSinglePeerChange(playerId: string) {
    const pm = this.peerManagers.get(playerId);
    if (!pm) return;

    const status = pm.status;
    this.setState({ peerStatus: this.derivePeerStatus() });

    if (status === "connected") {
      this.clearPeerRetryTimer();
      this.attachManagersForPeer(playerId, pm);
    }

    if (status === "disconnected" || status === "error") {
      const shouldRetry = this.roomManager.state.isJoined && this.roomManager.state.players.length >= 2;
      this.removePeer(playerId);
      if (this.peerManagers.size === 0 && shouldRetry) {
        this.schedulePeerRetry();
      }
    }
  }

  private removePeer(playerId: string) {
    const pm = this.peerManagers.get(playerId);
    if (pm) {
      pm.destroy();
      this.peerManagers.delete(playerId);
    }
    this.pendingSignals.delete(playerId);
    this.setState({ peerStatus: this.derivePeerStatus() });
  }

  private attachManagersForPeer(playerId: string, pm: PeerManager) {
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;

    if (!this.telephoneManager) {
      this.telephoneManager = new TelephoneManager(
        this.peerManagers,
        this.roomManager.state.myId ?? "",
        (partial) => {
          this.setState({ telephone: { ...this._state.telephone, ...partial } });
        },
        () => {
          this.gameLifecycle.endGame();
          this.setState({ gamePhase: "results" });
        },
      );
    }

    if (!this.masterpieceManager) {
      this.masterpieceManager = new MasterpieceManager(
        this.peerManagers,
        this.roomManager.state.myId ?? "",
        (partial) => {
          this.setState({ masterpiece: { ...this._state.masterpiece, ...partial } });
        },
        () => {
          this.gameLifecycle.endGame();
          this.setState({ gamePhase: "results" });
        },
      );
    }

    if (!this.chatManager) {
      this.chatManager = new ChatManager(pm, this.username, this._state.messages);
      this.chatManager.attach();
      this.cleanupFns.push(
        this.chatManager.subscribe(() => {
          this.setState({ messages: this.chatManager?.messages ?? [] });
        }),
      );
      this.setState({ messages: this.chatManager.messages });
    }

    if (!this.voteManager) {
      this.voteManager = new VoteManager(
        pm,
        this.roomManager.state.myId ?? "",
        this._state.modeSelection,
      );
      this.voteManager.attach();
      this.cleanupFns.push(
        this.voteManager.subscribe(() => {
          this.setState({ modeSelection: this.voteManager?.modeSelection ?? { type: "none" } });
        }),
      );
      this.setState({ modeSelection: this.voteManager.modeSelection });
    }

    if (!this.readyManager) {
      this.readyManager = new ReadyManager(
        pm,
        this.roomManager.state.myId ?? "",
        this._state.readyPlayers,
      );
      this.readyManager.attach();
      this.cleanupFns.push(
        this.readyManager.subscribe(() => {
          this.setState({ readyPlayers: this.readyManager?.readyPlayers ?? [] });
        }),
      );
      this.setState({ readyPlayers: this.readyManager.readyPlayers });
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

    if (isHost) {
      for (const player of players) {
        if (player.id !== myId && !this.peerManagers.has(player.id)) {
          this.createSinglePeer(player.id, true);
        }
      }
    } else {
      if (!this.peerManagers.has(hostId)) {
        this.createSinglePeer(hostId, false);
      }
    }
  }

  private onIncomingSignal = (data: IncomingSignal) => {
    const pm = this.peerManagers.get(data.senderId);
    if (!pm) {
      const queuedSignals = this.pendingSignals.get(data.senderId) ?? [];
      queuedSignals.push(data.signal);
      this.pendingSignals.set(data.senderId, queuedSignals);
      return;
    }
    pm.handleSignal(data.signal);
  };

  private onHostChanged = (newHostId: string) => {
    const oldHostId = this._state.hostId;
    this.setState({ hostId: newHostId });

    if (oldHostId === newHostId || !oldHostId) return;

    const hasPeerOrRetry = this.peerManagers.size > 0 || this.peerRetryTimer !== null;
    if (!hasPeerOrRetry) return;

    this.clearPeerRetryTimer();
    this.resetPeerChannel();
  };

  private teardownPeer() {
    this.clearPeerRetryTimer();
    this.resetPeerChannel();
  }

  private broadcast(data: string) {
    for (const pm of this.peerManagers.values()) {
      pm.send(data);
    }
  }

  private sendTo(targetId: string, data: string) {
    this.peerManagers.get(targetId)?.send(data);
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
    this.broadcast(JSON.stringify(envelope));
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
    this.broadcast(JSON.stringify(envelope));
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
    this.broadcast(JSON.stringify(envelope));
    this.setState({ strokes: [] });
  }

  startVote(candidates: GameModeId[]) {
    this.voteManager?.startVote(candidates);
  }

  castVote(mode: GameModeId) {
    this.voteManager?.castVote(mode);
  }

  endVote() {
    this.voteManager?.endVote();
  }

  hostSelectMode(mode: GameModeId) {
    this.voteManager?.hostSelectMode(mode);
  }

  changeMode() {
    this.voteManager?.changeMode();
  }

  toggleReady() {
    this.readyManager?.toggleReady();
  }

  startGame() {
    const mode = this._state.modeSelection.type === "host_picked" || this._state.modeSelection.type === "voting_complete"
      ? this._state.modeSelection.mode
      : null;
    if (!mode) return;

    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    const playerIds = this._state.players.map((p) => p.id);

    let config: Record<string, unknown> = {};

    if (mode === "telephone") {
      const totalRounds = this._state.telephone.totalRounds;
      config = { totalRounds };
    } else if (mode === "masterpiece") {
      config = { prompt: this._state.masterpiece.prompt };
    }

    const envelope: DataChannelMessage = {
      type: "game_start",
      payload: { mode, config },
    };
    this.broadcast(JSON.stringify(envelope));
    this.gameLifecycle.startGame(mode);
    this.setState({ gamePhase: "playing" });

    if (mode === "telephone") {
      this.telephoneManager?.startGame(mode, playerIds, this._state.telephone.totalRounds, isHost);
    } else if (mode === "masterpiece") {
      this.masterpieceManager?.startGame(mode, playerIds, isHost, this._state.masterpiece.prompt);
    }
  }

  private restartLocal() {
    this.telephoneManager?.restart();
    this.masterpieceManager?.restart();
    this.setState({
      gamePhase: "lobby",
      telephone: INITIAL_TELEPHONE,
      masterpiece: INITIAL_MASTERPIECE,
      modeSelection: { type: "none" },
      readyPlayers: [],
    });
  }

  restartGame() {
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (!isHost) return;
    const envelope: DataChannelMessage = {
      type: "game_phase",
      payload: { phase: "lobby" },
    };
    this.broadcast(JSON.stringify(envelope));
    this.gameLifecycle.restart();
    this.restartLocal();
  }

  telephoneSubmitPhrase(phrase: string) {
    const envelope: DataChannelMessage = { type: "telephone_phrase_submit", payload: { phrase } };
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (isHost) {
      this.telephoneManager?.handleMessage(this._state.myId!, envelope);
    } else {
      const hostId = this._state.hostId;
      if (hostId) this.sendTo(hostId, JSON.stringify(envelope));
    }
  }

  telephoneSubmitDrawing(strokes: StrokeData[]) {
    const envelope: DataChannelMessage = { type: "telephone_drawing_submit", payload: { strokes } };
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (isHost) {
      this.telephoneManager?.handleMessage(this._state.myId!, envelope);
    } else {
      const hostId = this._state.hostId;
      if (hostId) this.sendTo(hostId, JSON.stringify(envelope));
    }
  }

  telephoneSubmitDescription(text: string) {
    const envelope: DataChannelMessage = { type: "telephone_description_submit", payload: { text } };
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (isHost) {
      this.telephoneManager?.handleMessage(this._state.myId!, envelope);
    } else {
      const hostId = this._state.hostId;
      if (hostId) this.sendTo(hostId, JSON.stringify(envelope));
    }
  }

  setTelephoneRounds(rounds: number) {
    this.setState({
      telephone: { ...this._state.telephone, totalRounds: rounds },
    });
  }

  setMasterpiecePrompt(prompt: string) {
    this.setState({
      masterpiece: { ...this._state.masterpiece, prompt },
    });
  }

  masterpieceSubmitDrawing(strokes: StrokeData[]) {
    const envelope: DataChannelMessage = { type: "masterpiece_drawing_submit", payload: { strokes } };
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (isHost) {
      this.masterpieceManager?.handleMessage(this._state.myId!, envelope);
    } else {
      const hostId = this._state.hostId;
      if (hostId) this.sendTo(hostId, JSON.stringify(envelope));
    }
  }

  masterpieceSubmitVote(targetPlayerId: string) {
    const envelope: DataChannelMessage = { type: "masterpiece_vote_submit", payload: { targetPlayerId } };
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (isHost) {
      this.masterpieceManager?.handleMessage(this._state.myId!, envelope);
    } else {
      const hostId = this._state.hostId;
      if (hostId) this.sendTo(hostId, JSON.stringify(envelope));
    }
  }

  destroy() {
    this.socket.off("signal", this.onIncomingSignal);
    this.socket.off("hostChanged", this.onHostChanged);
    this.clearPeerRetryTimer();
    this.pendingSignals.clear();
    this.chatManager?.destroy();
    this.voteManager?.destroy();
    this.readyManager?.destroy();
    this.telephoneManager?.destroy();
    this.masterpieceManager?.destroy();
    this.gameLifecycle.destroy();
    for (const pm of this.peerManagers.values()) {
      pm.destroy();
    }
    this.peerManagers.clear();
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.roomManager.destroy();
    this.stateListeners.clear();
  }
}
