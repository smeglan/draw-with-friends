"use client";

import type { DataChannelMessage, StrokeData } from "@/network/events";
import type { TelephoneGameState } from "./types";
import type { TelephoneMessageBroker } from "./TelephoneMessageBroker";
import { SubmissionTracker } from "./SubmissionTracker";
import { getPhaseDef, type PhaseType } from "./PhaseConfig";
import { circularAssign, buildAllChains } from "./logic";

type StateEmitter = (partial: Partial<TelephoneGameState>) => void;

export class HostHandler {
  private currentPhase: PhaseType = "phrase";
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;
  private phaseEndsAt: number | null = null;
  private gameEnded = false;
  private totalRounds = 3;
  private playerIds: string[] = [];

  private hostPhrases = new Map<string, string>();
  private hostDrawings: Map<string, StrokeData[]>[] = [];
  private hostDescriptions: Map<string, string>[] = [];
  private submissions: SubmissionTracker;

  constructor(
    private broker: TelephoneMessageBroker,
    private myId: string,
    private emitState: StateEmitter,
    private onGameEnd: () => void,
  ) {
    this.submissions = new SubmissionTracker(0);
  }

  startGame(playerIds: string[], totalRounds: number): void {
    this.playerIds = playerIds;
    this.totalRounds = totalRounds;
    this.gameEnded = false;
    this.submissions = new SubmissionTracker(playerIds.length);

    this.hostPhrases = new Map();
    this.hostDrawings = [];
    this.hostDescriptions = [];

    this.beginPhase("phrase", 0, {
      phase: { type: "writing_phrase" },
      currentRound: 0,
      totalRounds,
      assignedPrompt: null,
      submittedPlayerIds: [],
    });
  }

  removePlayer(playerId: string): void {
    if (this.gameEnded) return;

    this.playerIds = this.playerIds.filter((id) => id !== playerId);
    this.submissions.delete(playerId);
    this.submissions.updateRequiredCount(this.playerIds.length);
    this.hostPhrases.delete(playerId);

    for (const slot of this.hostDrawings) slot.delete(playerId);
    for (const slot of this.hostDescriptions) slot.delete(playerId);

    if (this.playerIds.length < 2) {
      this.clearPhaseTimer();
      this.gameEnded = true;
      this.emitState({
        phase: { type: "idle" },
        chains: null,
        assignedPrompt: null,
        phaseEndsAt: null,
      });
      this.onGameEnd();
      return;
    }

    if (this.submissions.allSubmitted) {
      this.advanceFromCurrentPhase();
    } else {
      this.emitSubmissions();
    }
  }

  handleSubmission(senderId: string, msg: DataChannelMessage): void {
    if (this.gameEnded) return;

    switch (msg.type) {
      case "telephone_phrase_submit":
        if (this.currentPhase !== "phrase") return;
        this.hostPhrases.set(senderId, msg.payload.phrase);
        this.submissions.add(senderId);
        this.emitSubmissions();
        if (this.submissions.allSubmitted) this.advanceToDrawing();
        break;

      case "telephone_drawing_submit":
        if (this.currentPhase !== "drawing") return;
        this.ensureDrawingsSlot();
        this.hostDrawings[this.hostDrawings.length - 1].set(senderId, msg.payload.strokes);
        this.submissions.add(senderId);
        this.emitSubmissions();
        if (this.submissions.allSubmitted) this.advancePastDrawing();
        break;

      case "telephone_description_submit":
        if (this.currentPhase !== "describing") return;
        this.ensureDescriptionsSlot();
        this.hostDescriptions[this.hostDescriptions.length - 1].set(senderId, msg.payload.text);
        this.submissions.add(senderId);
        this.emitSubmissions();
        if (this.submissions.allSubmitted) this.advancePastDescription();
        break;
    }
  }

  restart(): void {
    this.gameEnded = false;
    this.currentPhase = "phrase";
    this.phaseEndsAt = null;
    this.hostPhrases = new Map();
    this.hostDrawings = [];
    this.hostDescriptions = [];
    this.submissions = new SubmissionTracker(0);
    this.clearPhaseTimer();
  }

  destroy(): void {
    this.clearPhaseTimer();
  }

  /* ───── Phase transitions ───── */

  private advanceFromCurrentPhase(): void {
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
  }

  private advanceToDrawing(force = false): void {
    if (force) this.fillMissingPhraseSubmissions();
    this.submissions.reset();
    this.submissions.updateRequiredCount(this.playerIds.length);

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
        this.emitState({
          assignedPrompt: { kind, content } as TelephoneGameState["assignedPrompt"],
        });
      } else {
        this.broker.sendTo(pid, {
          type: "telephone_assigned",
          payload: { kind, content },
        });
      }
    }

    this.beginPhase("drawing", roundIdx + 1, {
      currentRound: roundIdx + 1,
      submittedPlayerIds: [],
    });
  }

  private advancePastDrawing(force = false): void {
    if (force) this.fillMissingDrawingSubmissions();
    this.submissions.reset();
    this.submissions.updateRequiredCount(this.playerIds.length);

    const lastDrawings = this.hostDrawings[this.hostDrawings.length - 1];
    const assigned = circularAssign(this.playerIds, lastDrawings);

    for (const [pid, drawing] of assigned) {
      if (pid === this.myId) {
        this.emitState({
          assignedPrompt: { kind: "drawing", content: drawing } as TelephoneGameState["assignedPrompt"],
        });
      } else {
        this.broker.sendTo(pid, {
          type: "telephone_assigned",
          payload: { kind: "drawing", content: drawing },
        });
      }
    }

    this.beginPhase("describing", this.hostDrawings.length, {
      submittedPlayerIds: [],
    });
  }

  private advancePastDescription(force = false): void {
    if (force) this.fillMissingDescriptionSubmissions();

    if (this.hostDrawings.length < this.totalRounds) {
      this.advanceToDrawing();
    } else {
      this.advanceToReveal();
    }
  }

  private advanceToReveal(): void {
    this.clearPhaseTimer();
    this.phaseEndsAt = null;
    this.gameEnded = true;
    this.onGameEnd();

    const chains = buildAllChains(
      this.playerIds,
      this.hostPhrases,
      this.hostDrawings.map((d, i) => ({
        drawings: d,
        descriptions: i < this.hostDescriptions.length ? this.hostDescriptions[i] : new Map(),
      })),
    );

    this.emitState({
      phase: { type: "reveal" },
      chains,
      assignedPrompt: null,
      phaseEndsAt: null,
    });

    for (const pid of this.playerIds) {
      if (pid !== this.myId) {
        this.broker.sendTo(pid, {
          type: "telephone_reveal",
          payload: { chains },
        });
      }
    }
  }

  /* ───── Phase lifecycle ───── */

  private beginPhase(
    phase: PhaseType,
    round: number,
    partial: Partial<TelephoneGameState> = {},
  ): void {
    this.clearPhaseTimer();
    this.currentPhase = phase;
    const def = getPhaseDef(phase);
    this.phaseEndsAt = Date.now() + def.timeoutMs;

    this.emitState({
      ...partial,
      phase: { type: def.stateType },
      phaseEndsAt: this.phaseEndsAt,
    });

    this.phaseTimer = setTimeout(() => {
      this.onPhaseTimeout(phase);
    }, def.timeoutMs);

    this.broker.broadcast({
      type: "telephone_phase",
      payload: {
        phase: def.stateType,
        round,
        totalRounds: this.totalRounds,
        phaseEndsAt: this.phaseEndsAt,
      },
    });
  }

  private onPhaseTimeout(expectedPhase: PhaseType): void {
    this.phaseTimer = null;
    if (this.currentPhase !== expectedPhase) return;

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

  /* ───── Missing submissions fill ───── */

  private fillMissingPhraseSubmissions(): void {
    for (const playerId of this.playerIds) {
      if (!this.hostPhrases.has(playerId)) {
        this.hostPhrases.set(playerId, "...");
      }
    }
  }

  private fillMissingDrawingSubmissions(): void {
    this.ensureDrawingsSlot();
    const slot = this.hostDrawings[this.hostDrawings.length - 1];
    for (const playerId of this.playerIds) {
      if (!slot.has(playerId)) {
        slot.set(playerId, []);
      }
    }
  }

  private fillMissingDescriptionSubmissions(): void {
    this.ensureDescriptionsSlot();
    const slot = this.hostDescriptions[this.hostDescriptions.length - 1];
    for (const playerId of this.playerIds) {
      if (!slot.has(playerId)) {
        slot.set(playerId, "...");
      }
    }
  }

  /* ───── Slot helpers ───── */

  private ensureDrawingsSlot(): void {
    if (
      this.hostDrawings.length === 0 ||
      this.hostDrawings[this.hostDrawings.length - 1].size >= this.playerIds.length
    ) {
      this.hostDrawings.push(new Map());
    }
  }

  private ensureDescriptionsSlot(): void {
    if (
      this.hostDescriptions.length === 0 ||
      this.hostDescriptions[this.hostDescriptions.length - 1].size >= this.playerIds.length
    ) {
      this.hostDescriptions.push(new Map());
    }
  }

  /* ───── Helpers ───── */

  private emitSubmissions(): void {
    this.emitState({
      submittedPlayerIds: this.submissions.submittedIds,
    });
  }

  private clearPhaseTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }
}
