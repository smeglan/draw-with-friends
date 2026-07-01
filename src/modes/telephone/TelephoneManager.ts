"use client";

import type { PeerManager } from "@/network/client/PeerManager";
import type { DataChannelMessage, StrokeData, TelephoneChainLink } from "@/network/events";
import type { TelephoneGameState } from "./types";
import { circularAssign, buildAllChains } from "./logic";

type PhaseType = "phrase" | "drawing" | "describing";

const PHASE_TIMEOUTS_MS: Record<PhaseType, number> = {
  phrase: 45_000,
  drawing: 60_000,
  describing: 45_000,
};

const PHASE_STATE_TYPES: Record<PhaseType, TelephoneGameState["phase"]["type"]> = {
  phrase: "writing_phrase",
  drawing: "drawing",
  describing: "describing",
};

export class TelephoneManager {
  private peerManagers: Map<string, PeerManager>;
  private myId: string;
  private onStateChange: (partial: Partial<TelephoneGameState>) => void;
  private isHost = false;
  private gameEnded = false;
  private playerIds: string[] = [];
  private totalRounds = 3;
  private currentPhase: PhaseType = "phrase";
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;
  private phaseEndsAt: number | null = null;
  private onGameEnd: (() => void) | null = null;

  private hostPhrases = new Map<string, string>();
  private hostDrawings: Map<string, StrokeData[]>[] = [];
  private hostDescriptions: Map<string, string>[] = [];
  private currentSubmissions = new Set<string>();

  constructor(
    peerManagers: Map<string, PeerManager>,
    myId: string,
    onStateChange: (partial: Partial<TelephoneGameState>) => void,
    onGameEnd?: () => void,
  ) {
    this.peerManagers = peerManagers;
    this.myId = myId;
    this.onStateChange = onStateChange;
    this.onGameEnd = onGameEnd ?? null;
  }

  restart() {
    this.gameEnded = false;
    this.currentPhase = "phrase";
    this.phaseEndsAt = null;
    this.hostPhrases = new Map();
    this.hostDrawings = [];
    this.hostDescriptions = [];
    this.currentSubmissions = new Set();
    this.clearPhaseTimer();
  }

  startGame(mode: string, playerIds: string[], totalRounds = 3, isHost: boolean) {
    this.playerIds = playerIds;
    this.isHost = isHost;
    this.gameEnded = false;
    this.totalRounds = totalRounds;
    this.currentPhase = "phrase";
    this.phaseEndsAt = null;

    this.hostPhrases = new Map();
    this.hostDrawings = [];
    this.hostDescriptions = [];
    this.currentSubmissions = new Set();
    this.clearPhaseTimer();

    if (this.isHost) {
      this.beginHostPhase("phrase", 0, {
        phase: { type: "writing_phrase" },
        currentRound: 0,
        totalRounds,
        assignedPrompt: null,
        submittedPlayerIds: [],
      });
    }
  }

  handleMessage(senderId: string, msg: DataChannelMessage) {
    if (this.isHost) {
      this.handleHostMessage(senderId, msg);
    } else {
      this.handleClientMessage(senderId, msg);
    }
  }

  removePlayer(playerId: string) {
    if (!this.isHost || this.gameEnded) return;

    this.playerIds = this.playerIds.filter((id) => id !== playerId);
    this.currentSubmissions.delete(playerId);
    this.hostPhrases.delete(playerId);

    for (const slot of this.hostDrawings) slot.delete(playerId);
    for (const slot of this.hostDescriptions) slot.delete(playerId);

    if (this.playerIds.length < 2) {
      this.clearPhaseTimer();
      this.gameEnded = true;
      this.onStateChange({
        phase: { type: "idle" },
        chains: null,
        assignedPrompt: null,
        phaseEndsAt: null,
      });
      this.onGameEnd?.();
      return;
    }

    if (this.currentSubmissions.size >= this.playerIds.length) {
      switch (this.currentPhase) {
        case "phrase":
          this.advanceToDrawing();
          break;
        case "drawing":
          this.advancePastDrawing();
          break;
        case "describing":
          this.advancePastDescription();
          break;
      }
    } else {
      this.notifySubmissions();
    }
  }

  /* ───── HOST message handling ───── */

  private handleHostMessage(senderId: string, msg: DataChannelMessage) {
    if (this.gameEnded) return;

    switch (msg.type) {
      case "telephone_phrase_submit":
        if (this.currentPhase !== "phrase") return;
        this.hostPhrases.set(senderId, msg.payload.phrase);
        this.currentSubmissions.add(senderId);
        this.notifySubmissions();
        if (this.currentSubmissions.size >= this.playerIds.length) {
          this.advanceToDrawing();
        }
        break;

      case "telephone_drawing_submit":
        if (this.currentPhase !== "drawing") return;
        this.ensureDrawingsSlot();
        this.hostDrawings[this.hostDrawings.length - 1].set(senderId, msg.payload.strokes);
        this.currentSubmissions.add(senderId);
        this.notifySubmissions();
        if (this.currentSubmissions.size >= this.playerIds.length) {
          this.advancePastDrawing();
        }
        break;

      case "telephone_description_submit":
        if (this.currentPhase !== "describing") return;
        this.ensureDescriptionsSlot();
        this.hostDescriptions[this.hostDescriptions.length - 1].set(senderId, msg.payload.text);
        this.currentSubmissions.add(senderId);
        this.notifySubmissions();
        if (this.currentSubmissions.size >= this.playerIds.length) {
          this.advancePastDescription();
        }
        break;
    }
  }

  private beginHostPhase(
    phase: PhaseType,
    round: number,
    partial: Partial<TelephoneGameState> = {},
  ) {
    this.clearPhaseTimer();
    this.currentPhase = phase;
    this.phaseEndsAt = Date.now() + PHASE_TIMEOUTS_MS[phase];

    this.onStateChange({
      ...partial,
      phase: { type: PHASE_STATE_TYPES[phase] },
      phaseEndsAt: this.phaseEndsAt,
    });

    this.phaseTimer = setTimeout(() => {
      this.onPhaseTimeout(phase);
    }, PHASE_TIMEOUTS_MS[phase]);

    this.broadcastPhase(PHASE_STATE_TYPES[phase], round, this.phaseEndsAt);
  }

  private onPhaseTimeout(expectedPhase: PhaseType) {
    this.phaseTimer = null;
    if (!this.isHost || this.currentPhase !== expectedPhase) return;

    if (expectedPhase === "phrase") {
      this.advanceToDrawing(true);
      return;
    }

    if (expectedPhase === "drawing") {
      this.advancePastDrawing(true);
      return;
    }

    this.advancePastDescription(true);
  }

  private fillMissingPhraseSubmissions() {
    for (const playerId of this.playerIds) {
      if (!this.hostPhrases.has(playerId)) {
        this.hostPhrases.set(playerId, "...");
      }
    }
  }

  private fillMissingDrawingSubmissions() {
    this.ensureDrawingsSlot();
    const slot = this.hostDrawings[this.hostDrawings.length - 1];
    for (const playerId of this.playerIds) {
      if (!slot.has(playerId)) {
        slot.set(playerId, []);
      }
    }
  }

  private fillMissingDescriptionSubmissions() {
    this.ensureDescriptionsSlot();
    const slot = this.hostDescriptions[this.hostDescriptions.length - 1];
    for (const playerId of this.playerIds) {
      if (!slot.has(playerId)) {
        slot.set(playerId, "...");
      }
    }
  }

  private advanceToDrawing(force = false) {
    if (force) {
      this.fillMissingPhraseSubmissions();
    }
    this.currentSubmissions = new Set();

    const roundIdx = this.hostDrawings.length;
    const isFirst = roundIdx === 0;
    let assigned: Map<string, unknown>;

    if (isFirst) {
      assigned = circularAssign(this.playerIds, this.hostPhrases) as Map<string, unknown>;
    } else {
      const lastDescriptions = this.hostDescriptions[this.hostDescriptions.length - 1];
      assigned = circularAssign(this.playerIds, lastDescriptions) as Map<string, unknown>;
    }

    const kind = isFirst ? "phrase" : "description";

    for (const [pid, content] of assigned) {
      if (pid === this.myId) {
        this.onStateChange({
          assignedPrompt: { kind, content } as TelephoneGameState["assignedPrompt"],
        });
      } else {
        this.sendTo(pid, {
          type: "telephone_assigned",
          payload: { kind, content },
        });
      }
    }

    this.beginHostPhase("drawing", roundIdx + 1, {
      currentRound: roundIdx + 1,
      submittedPlayerIds: [],
    });
  }

  private advancePastDrawing(force = false) {
    if (force) {
      this.fillMissingDrawingSubmissions();
    }
    this.currentSubmissions = new Set();
    const lastDrawings = this.hostDrawings[this.hostDrawings.length - 1];
    const assigned = circularAssign(this.playerIds, lastDrawings);

    for (const [pid, drawing] of assigned) {
      if (pid === this.myId) {
        this.onStateChange({
          assignedPrompt: { kind: "drawing", content: drawing } as TelephoneGameState["assignedPrompt"],
        });
      } else {
        this.sendTo(pid, {
          type: "telephone_assigned",
          payload: { kind: "drawing", content: drawing },
        });
      }
    }

    this.beginHostPhase("describing", this.hostDrawings.length, {
      submittedPlayerIds: [],
    });
  }

  private advancePastDescription(force = false) {
    if (force) {
      this.fillMissingDescriptionSubmissions();
    }
    if (this.hostDrawings.length < this.totalRounds) {
      this.advanceToDrawing();
    } else {
      this.advanceToReveal();
    }
  }

  private advanceToReveal() {
    this.clearPhaseTimer();
    this.phaseEndsAt = null;
    this.gameEnded = true;
    this.onGameEnd?.();
    const chains = buildAllChains(
      this.playerIds,
      this.hostPhrases,
      this.hostDrawings.map((d, i) => ({
        drawings: d,
        descriptions: i < this.hostDescriptions.length ? this.hostDescriptions[i] : new Map(),
      })),
    );

    this.onStateChange({
      phase: { type: "reveal" },
      chains,
      assignedPrompt: null,
      phaseEndsAt: null,
    });

    for (const pid of this.playerIds) {
      if (pid !== this.myId) {
        this.sendTo(pid, {
          type: "telephone_reveal",
          payload: { chains },
        });
      }
    }
  }

  /* ───── CLIENT message handling ───── */

  private handleClientMessage(_senderId: string, msg: DataChannelMessage) {
    switch (msg.type) {
      case "telephone_phase": {
        const p = msg.payload;
        const mapped = this.mapPhase(p.phase);
        this.onStateChange({
          phase: { type: mapped } as TelephoneGameState["phase"],
          currentRound: p.round ?? 0,
          totalRounds: p.totalRounds ?? 3,
          phaseEndsAt: p.phaseEndsAt ?? null,
          assignedPrompt: null,
          submittedPlayerIds: [],
        });
        break;
      }

      case "telephone_assigned":
        this.onStateChange({
          assignedPrompt: msg.payload as TelephoneGameState["assignedPrompt"],
        });
        break;

      case "telephone_reveal":
        this.onStateChange({
          phase: { type: "reveal" },
          chains: msg.payload.chains,
          assignedPrompt: null,
          phaseEndsAt: null,
        });
        break;

      case "telephone_all_submitted":
        this.onStateChange({
          submittedPlayerIds: [...this.playerIds],
        });
        break;
    }
  }

  private mapPhase(p: string): TelephoneGameState["phase"]["type"] {
    if (p === "writing_phrase") return "writing_phrase";
    if (p === "drawing") return "drawing";
    if (p === "describing") return "describing";
    if (p === "waiting") return "waiting";
    if (p === "reveal") return "reveal";
    return "waiting";
  }

  /* ───── helpers ───── */

  private ensureDrawingsSlot() {
    if (
      this.hostDrawings.length === 0 ||
      this.hostDrawings[this.hostDrawings.length - 1].size >= this.playerIds.length
    ) {
      this.hostDrawings.push(new Map());
    }
  }

  private ensureDescriptionsSlot() {
    if (
      this.hostDescriptions.length === 0 ||
      this.hostDescriptions[this.hostDescriptions.length - 1].size >= this.playerIds.length
    ) {
      this.hostDescriptions.push(new Map());
    }
  }

  private notifySubmissions() {
    this.onStateChange({
      submittedPlayerIds: Array.from(this.currentSubmissions),
    });
  }

  private clearPhaseTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private broadcastPhase(phase: string, round: number, phaseEndsAt?: number | null) {
    const raw = JSON.stringify({
      type: "telephone_phase",
      payload: { phase, round, totalRounds: this.totalRounds, phaseEndsAt: phaseEndsAt ?? undefined },
    });
    for (const pm of this.peerManagers.values()) {
      pm.send(raw);
    }
  }

  private sendTo(targetId: string, msg: DataChannelMessage) {
    const pm = this.peerManagers.get(targetId);
    if (pm) pm.send(JSON.stringify(msg));
  }

  destroy() {
    this.clearPhaseTimer();
    this.peerManagers.clear();
  }
}
