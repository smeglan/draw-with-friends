"use client";

import type { DataChannelMessage } from "@/network/events";
import type { TelephoneGameState } from "./types";

type StateEmitter = (partial: Partial<TelephoneGameState>) => void;

const VALID_PHASES = new Set<string>([
  "writing_phrase",
  "drawing",
  "describing",
  "waiting",
  "reveal",
]);

export class ClientHandler {
  constructor(private emitState: StateEmitter) {}

  handleMessage(_senderId: string, msg: DataChannelMessage): void {
    switch (msg.type) {
      case "telephone_phase": {
        const p = msg.payload;
        const mapped = this.mapPhase(p.phase);
        this.emitState({
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
        this.emitState({
          assignedPrompt: msg.payload as TelephoneGameState["assignedPrompt"],
        });
        break;

      case "telephone_reveal":
        this.emitState({
          phase: { type: "reveal" },
          chains: msg.payload.chains,
          assignedPrompt: null,
          phaseEndsAt: null,
        });
        break;

      case "telephone_all_submitted":
        this.emitState({
          submittedPlayerIds: [...this.playerIds],
        });
        break;
    }
  }

  restart(): void {}

  private playerIds: string[] = [];

  setPlayerIds(ids: string[]): void {
    this.playerIds = ids;
  }

  private mapPhase(p: string): TelephoneGameState["phase"]["type"] {
    if (VALID_PHASES.has(p)) return p as TelephoneGameState["phase"]["type"];
    return "waiting";
  }
}
