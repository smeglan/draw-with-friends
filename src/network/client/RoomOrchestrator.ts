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
import type { ModeSelectionState, GameModeId, RoomSetupState, ModeSetupMethod, PromptProposal } from "@/modes/types";
import type { TelephoneGameState } from "@/modes/telephone/types";
import { TelephoneManager } from "@/modes/telephone/TelephoneManager";
import type { MasterpieceGameState } from "@/modes/masterpiece/types";
import { MasterpieceManager } from "@/modes/masterpiece/MasterpieceManager";

export interface OrchestratorState extends RoomManagerState {
  peerStatus: PeerStatus;
  messages: ChatMessage[];
  strokes: StrokeData[];
  modeSelection: ModeSelectionState;
  roomSetup: RoomSetupState;
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

const createInitialRoomSetup = (): RoomSetupState => ({
  method: null,
  phase: "idle",
  selectedMode: null,
  config: null,
  configVersion: 0,
  readyPlayers: [],
  promptCandidates: [],
  promptVotes: {},
  promptWinnerId: null,
});

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
  roomSetup: createInitialRoomSetup(),
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
      roomSetup: createInitialRoomSetup(),
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

      if (msg.type === "mode_config_updated") {
        // Configuration is host-owned during phase 3. Ignore updates from
        // other peers so a client cannot overwrite the lobby setup.
        if (this._state.hostId && senderId !== this._state.hostId) return;
        if (msg.payload.version < this._state.roomSetup.configVersion) return;

        const config = msg.payload.config;
        if (msg.payload.mode === "masterpiece" && config.mode === "masterpiece") {
          this.setState({
            masterpiece: { ...this._state.masterpiece, prompt: config.prompt },
            roomSetup: {
              ...this._state.roomSetup,
              phase: "configured",
              selectedMode: "masterpiece",
              config,
              configVersion: msg.payload.version,
            },
          });
          return;
        }

        if (
          msg.payload.mode === "telephone" &&
          config.mode === "telephone" &&
          Number.isInteger(config.totalRounds) &&
          config.totalRounds >= 1 &&
          config.totalRounds <= 10
        ) {
          this.setState({
            telephone: { ...this._state.telephone, totalRounds: config.totalRounds },
            roomSetup: {
              ...this._state.roomSetup,
              phase: "configured",
              selectedMode: "telephone",
              config,
              configVersion: msg.payload.version,
            },
          });
        }
        return;
      }

      if (msg.type === "setup_method_selected") {
        if (this._state.hostId && senderId !== this._state.hostId) return;
        this.setState({
          roomSetup: {
            ...this._state.roomSetup,
            method: msg.payload.method,
            phase: msg.payload.method === "room_decides" ? "mode_voting" : "configuring",
          },
        });
        return;
      }

      if (msg.type === "masterpiece_prompt_proposed") {
        if (this._state.roomSetup.method !== "room_decides") return;
        if (this._state.roomSetup.selectedMode !== "masterpiece") return;
        if (this._state.roomSetup.phase !== "configuring") return;
        const proposal = msg.payload.proposal;
        if (proposal.text.trim().length === 0 || proposal.text.length > 120) return;
        const candidates = this._state.roomSetup.promptCandidates
          .filter((item) => item.playerId !== proposal.playerId && item.id !== proposal.id);
        this.setState({
          roomSetup: {
            ...this._state.roomSetup,
            phase: "configuring",
            selectedMode: "masterpiece",
            promptCandidates: [...candidates, { ...proposal, text: proposal.text.trim() }],
          },
        });
        return;
      }

      if (msg.type === "masterpiece_prompt_vote_started") {
        if (this._state.hostId && senderId !== this._state.hostId) return;
        this.setState({
          roomSetup: {
            ...this._state.roomSetup,
            phase: "config_voting",
            selectedMode: "masterpiece",
            promptCandidates: msg.payload.candidates,
            promptVotes: {},
            promptWinnerId: null,
          },
        });
        return;
      }

      if (msg.type === "masterpiece_prompt_vote_cast") {
        if (this._state.roomSetup.phase !== "config_voting") return;
        if (!this._state.roomSetup.promptCandidates.some((candidate) => candidate.id === msg.payload.proposalId)) return;
        this.setState({
          roomSetup: {
            ...this._state.roomSetup,
            promptVotes: {
              ...this._state.roomSetup.promptVotes,
              [msg.payload.playerId]: msg.payload.proposalId,
            },
          },
        });
        return;
      }

      if (msg.type === "masterpiece_prompt_vote_ended") {
        if (this._state.hostId && senderId !== this._state.hostId) return;
        const winner = this._state.roomSetup.promptCandidates.find((candidate) => candidate.id === msg.payload.winnerId);
        if (!winner || msg.payload.prompt.trim().length === 0) return;
        const config = {
          mode: "masterpiece" as const,
          promptSource: "room_vote" as const,
          prompt: msg.payload.prompt.trim().slice(0, 120),
        };
        this.setState({
          masterpiece: { ...this._state.masterpiece, prompt: config.prompt },
          roomSetup: {
            ...this._state.roomSetup,
            phase: "configured",
            selectedMode: "masterpiece",
            config,
            configVersion: msg.payload.version,
            promptWinnerId: winner.id,
          },
        });
        return;
      }

      if (msg.type === "game_start") {
        if (this._state.hostId && senderId !== this._state.hostId) return;
        if (!["masterpiece", "fusion", "telephone", "pictionary"].includes(msg.payload.mode)) return;
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
          const prompt = (msg.payload.config?.prompt as string) ?? "";
          this.masterpieceManager?.startGame(
            mode,
            playerIds,
            false,
            prompt,
          );
          this.setState({
            roomSetup: {
              ...this._state.roomSetup,
              phase: "configured",
              selectedMode: "masterpiece",
              config: { mode: "masterpiece", promptSource: "host", prompt },
            },
          });
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
          const modeSelection = this.voteManager?.modeSelection ?? { type: "none" };
          const setupPatch = modeSelection.type === "voting"
            ? { phase: "mode_voting" as const }
            : modeSelection.type === "voting_complete"
              ? {
                  phase: modeSelection.mode === "masterpiece" && this._state.roomSetup.method === "room_decides"
                    ? "configuring" as const
                    : "mode_selected" as const,
                  selectedMode: modeSelection.mode,
                }
              : {};
          this.setState({
            modeSelection,
            roomSetup: { ...this._state.roomSetup, ...setupPatch },
            ...(modeSelection.type === "none"
              ? {
                  roomSetup: {
                    ...this._state.roomSetup,
                    phase: "idle",
                    selectedMode: null,
                    config: null,
                    promptCandidates: [],
                    promptVotes: {},
                    promptWinnerId: null,
                  },
                }
              : {}),
          });
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
          const readyPlayers = this.readyManager?.readyPlayers ?? [];
          this.setState({
            readyPlayers,
            roomSetup: { ...this._state.roomSetup, readyPlayers },
          });
        }),
      );
      this.setState({
        readyPlayers: this.readyManager.readyPlayers,
        roomSetup: { ...this._state.roomSetup, readyPlayers: this.readyManager.readyPlayers },
      });
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
    this.setState({
      roomSetup: { ...this._state.roomSetup, phase: "mode_voting" },
    });
  }

  selectSetupMethod(method: ModeSetupMethod) {
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (!isHost) return;
    const envelope: DataChannelMessage = {
      type: "setup_method_selected",
      payload: { method },
    };
    this.broadcast(JSON.stringify(envelope));
    this.setState({
      roomSetup: {
        ...this._state.roomSetup,
        method,
        phase: method === "room_decides" ? "mode_voting" : "configuring",
      },
    });
  }

  castVote(mode: GameModeId) {
    this.voteManager?.castVote(mode);
  }

  endVote() {
    this.voteManager?.endVote();
  }

  hostSelectMode(mode: GameModeId) {
    this.voteManager?.hostSelectMode(mode);
    this.setState({
      roomSetup: {
        ...this._state.roomSetup,
        phase: mode === "masterpiece" && this._state.roomSetup.config?.mode === "masterpiece"
          ? "configured"
          : "mode_selected",
        selectedMode: mode,
        config: mode === "masterpiece" && this._state.roomSetup.config?.mode === "masterpiece"
          ? this._state.roomSetup.config
          : null,
        promptCandidates: mode === "masterpiece" ? this._state.roomSetup.promptCandidates : [],
        promptVotes: mode === "masterpiece" ? this._state.roomSetup.promptVotes : {},
        promptWinnerId: mode === "masterpiece" ? this._state.roomSetup.promptWinnerId : null,
      },
    });
  }

  changeMode() {
    this.voteManager?.changeMode();
    this.setState({
      roomSetup: {
        ...this._state.roomSetup,
        phase: "idle",
        selectedMode: null,
        config: null,
        promptCandidates: [],
        promptVotes: {},
        promptWinnerId: null,
      },
    });
  }

  toggleReady() {
    this.readyManager?.toggleReady();
  }

  startGame() {
    const mode = this._state.modeSelection.type === "host_picked" || this._state.modeSelection.type === "voting_complete"
      ? this._state.modeSelection.mode
      : null;
    if (!mode || this._state.gamePhase !== "lobby") return;

    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (!isHost) return;

    const setup = this._state.roomSetup;
    if (setup.selectedMode !== mode) return;
    if (mode === "masterpiece" && setup.config?.mode !== "masterpiece") return;
    const playerIds = this._state.players.map((p) => p.id);

    let config: Record<string, unknown> = {};

    if (mode === "telephone") {
      const totalRounds = this._state.telephone.totalRounds;
      config = { totalRounds };
    } else if (mode === "masterpiece") {
      const setupConfig = this._state.roomSetup.config;
      config = {
        prompt: setupConfig?.mode === "masterpiece"
          ? setupConfig.prompt
          : this._state.masterpiece.prompt,
      };
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
      const setupConfig = this._state.roomSetup.config;
      const prompt = setupConfig?.mode === "masterpiece"
        ? setupConfig.prompt
        : this._state.masterpiece.prompt;
      this.masterpieceManager?.startGame(mode, playerIds, isHost, prompt);
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
      roomSetup: createInitialRoomSetup(),
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
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (!isHost) return;

    const totalRounds = Math.min(10, Math.max(1, Math.round(rounds || 1)));
    const version = this._state.roomSetup.configVersion + 1;
    const config = {
      mode: "telephone" as const,
      preset: "normal" as const,
      totalRounds,
    };
    const envelope: DataChannelMessage = {
      type: "mode_config_updated",
      payload: { mode: "telephone", config, version },
    };
    this.broadcast(JSON.stringify(envelope));
    this.setState({
      telephone: { ...this._state.telephone, totalRounds },
      roomSetup: {
        ...this._state.roomSetup,
        phase: "configured",
        selectedMode: "telephone",
        config,
        configVersion: version,
      },
    });
  }

  setMasterpiecePrompt(prompt: string) {
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (!isHost) return;

    const normalizedPrompt = prompt.trim().slice(0, 120);
    const version = this._state.roomSetup.configVersion + 1;
    const config = {
      mode: "masterpiece" as const,
      promptSource: "host" as const,
      prompt: normalizedPrompt,
    };
    const envelope: DataChannelMessage = {
      type: "mode_config_updated",
      payload: { mode: "masterpiece", config, version },
    };
    this.broadcast(JSON.stringify(envelope));
    this.setState({
      masterpiece: { ...this._state.masterpiece, prompt: normalizedPrompt },
      roomSetup: {
        ...this._state.roomSetup,
        phase: "configured",
        selectedMode: "masterpiece",
        config,
        configVersion: version,
      },
    });
  }

  submitMasterpiecePromptProposal(text: string) {
    const playerId = this._state.myId;
    if (!playerId || this._state.roomSetup.method !== "room_decides") return;
    if (this._state.roomSetup.selectedMode !== "masterpiece") return;
    if (this._state.roomSetup.phase !== "configuring") return;

    const normalizedText = text.trim().slice(0, 120);
    if (!normalizedText) return;

    const proposal: PromptProposal = {
      id: `${playerId}-${Date.now()}`,
      playerId,
      text: normalizedText,
    };
    const envelope: DataChannelMessage = {
      type: "masterpiece_prompt_proposed",
      payload: { proposal },
    };
    this.broadcast(JSON.stringify(envelope));
    this.setState({
      roomSetup: {
        ...this._state.roomSetup,
        phase: "configuring",
        promptCandidates: [
          ...this._state.roomSetup.promptCandidates.filter((item) => item.playerId !== playerId),
          proposal,
        ],
      },
    });
  }

  startMasterpiecePromptVote() {
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    const candidates = this._state.roomSetup.promptCandidates;
    if (!isHost || this._state.roomSetup.method !== "room_decides") return;
    if (this._state.roomSetup.selectedMode !== "masterpiece" || this._state.roomSetup.phase !== "configuring") return;
    if (candidates.length === 0) return;

    const envelope: DataChannelMessage = {
      type: "masterpiece_prompt_vote_started",
      payload: { candidates },
    };
    this.broadcast(JSON.stringify(envelope));
    this.setState({
      roomSetup: {
        ...this._state.roomSetup,
        phase: "config_voting",
        promptVotes: {},
        promptWinnerId: null,
      },
    });
  }

  voteMasterpiecePrompt(proposalId: string) {
    if (this._state.roomSetup.phase !== "config_voting") return;
    if (!this._state.roomSetup.promptCandidates.some((candidate) => candidate.id === proposalId)) return;
    const playerId = this._state.myId;
    if (!playerId) return;

    const envelope: DataChannelMessage = {
      type: "masterpiece_prompt_vote_cast",
      payload: { playerId, proposalId },
    };
    this.broadcast(JSON.stringify(envelope));
    this.setState({
      roomSetup: {
        ...this._state.roomSetup,
        promptVotes: { ...this._state.roomSetup.promptVotes, [playerId]: proposalId },
      },
    });
  }

  endMasterpiecePromptVote() {
    const isHost = this._state.myId !== null && this._state.myId === this._state.hostId;
    if (!isHost || this._state.roomSetup.phase !== "config_voting") return;

    const counts = new Map<string, number>();
    for (const proposalId of Object.values(this._state.roomSetup.promptVotes)) {
      counts.set(proposalId, (counts.get(proposalId) ?? 0) + 1);
    }
    if (counts.size === 0) return;

    const winnerId = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
    const winner = this._state.roomSetup.promptCandidates.find((candidate) => candidate.id === winnerId);
    if (!winner) return;

    const version = this._state.roomSetup.configVersion + 1;
    const envelope: DataChannelMessage = {
      type: "masterpiece_prompt_vote_ended",
      payload: { winnerId, prompt: winner.text, version },
    };
    this.broadcast(JSON.stringify(envelope));

    const config = {
      mode: "masterpiece" as const,
      promptSource: "room_vote" as const,
      prompt: winner.text,
    };
    this.setState({
      masterpiece: { ...this._state.masterpiece, prompt: winner.text },
      roomSetup: {
        ...this._state.roomSetup,
        phase: "configured",
        config,
        configVersion: version,
        promptWinnerId: winnerId,
      },
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
