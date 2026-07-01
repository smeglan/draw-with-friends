"use client";

import type { PeerManager } from "@/network/client/PeerManager";
import type { DataChannelMessage, StrokeData } from "@/network/events";
import type { MasterpieceGameState, MasterpieceSubmission } from "./types";

const RANDOM_PROMPTS = [
  "Un robot haciendo malabares",
  "Un gato astronauta",
  "Tu cena ideal",
  "Un paisaje surrealista",
  "Un superhéroe cotidiano",
  "Un dragón en una oficina",
  "El sueño más raro que tuviste",
  "Una pizza con los toppings más locos",
  "Un extraterrestre tomando mate",
  "Un castillo en las nubes",
  "Un perro dando una conferencia",
  "Un bosque encantado con objetos cotidianos",
  "La ciudad del futuro vista por un niño",
  "Un viaje en subte surrealista",
  "Una mascota con superpoderes",
];

export class MasterpieceManager {
  private peerManagers: Map<string, PeerManager>;
  private myId: string;
  private onStateChange: (partial: Partial<MasterpieceGameState>) => void;
  private onGameEnd: (() => void) | null = null;
  private isHost = false;
  private gameEnded = false;
  private playerIds: string[] = [];
  private phaseTimer: ReturnType<typeof setTimeout> | null = null;

  private hostSubmissions = new Map<string, StrokeData[]>();
  private hostVotes = new Map<string, string>();

  constructor(
    peerManagers: Map<string, PeerManager>,
    myId: string,
    onStateChange: (partial: Partial<MasterpieceGameState>) => void,
    onGameEnd?: () => void,
  ) {
    this.peerManagers = peerManagers;
    this.myId = myId;
    this.onStateChange = onStateChange;
    this.onGameEnd = onGameEnd ?? null;
  }

  startGame(mode: string, playerIds: string[], isHost: boolean, prompt: string) {
    this.playerIds = playerIds;
    this.isHost = isHost;
    this.gameEnded = false;
    this.hostSubmissions = new Map();
    this.hostVotes = new Map();
    this.clearPhaseTimer();

    if (this.isHost) {
      this.beginHostPhase("creating", prompt);
    }
  }

  restart() {
    this.gameEnded = false;
    this.hostSubmissions = new Map();
    this.hostVotes = new Map();
    this.clearPhaseTimer();
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
    this.hostSubmissions.delete(playerId);
    this.hostVotes.delete(playerId);

    if (this.playerIds.length < 2) {
      this.clearPhaseTimer();
      this.gameEnded = true;
      this.onStateChange({
        phase: { type: "idle" },
        submissions: [],
        submittedPlayerIds: [],
        votedPlayerIds: [],
        votes: {},
        rankings: null,
        phaseEndsAt: null,
      });
      this.onGameEnd?.();
      return;
    }

    const currentPhase = this.getStatePhase();
    if (currentPhase === "creating") {
      if (this.hostSubmissions.size >= this.playerIds.length) {
        this.advanceToVoting();
      } else {
        this.notifySubmissions();
      }
    } else if (currentPhase === "voting") {
      if (this.hostVotes.size >= this.playerIds.length) {
        this.advanceToResults();
      }
    }
  }

  private getStatePhase(): "creating" | "voting" {
    return this.hostVotes.size > 0 || this.hostSubmissions.size >= this.playerIds.length
      ? "voting"
      : "creating";
  }

  /* ───── HOST ───── */

  private handleHostMessage(senderId: string, msg: DataChannelMessage) {
    if (this.gameEnded) return;

    switch (msg.type) {
      case "masterpiece_drawing_submit": {
        if (this.hostSubmissions.size >= this.playerIds.length) return;
        this.hostSubmissions.set(senderId, msg.payload.strokes);
        this.notifySubmissions();
        if (this.hostSubmissions.size >= this.playerIds.length) {
          this.clearPhaseTimer();
          this.advanceToVoting();
        }
        break;
      }
      case "masterpiece_vote_submit": {
        if (this.hostVotes.has(senderId)) return;
        this.hostVotes.set(senderId, msg.payload.targetPlayerId);
        this.notifyVotes();
        if (this.hostVotes.size >= this.playerIds.length) {
          this.clearPhaseTimer();
          this.advanceToResults();
        }
        break;
      }
    }
  }

  private beginHostPhase(phase: "creating" | "voting", prompt?: string) {
    this.clearPhaseTimer();

    if (phase === "creating") {
      const timeout = 90_000;
      const phaseEndsAt = Date.now() + timeout;

      this.onStateChange({
        phase: { type: "creating" },
        prompt: prompt ?? RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)],
        submissions: [],
        submittedPlayerIds: [],
        phaseEndsAt,
      });

      this.phaseTimer = setTimeout(() => {
        this.onPhaseTimeout();
      }, timeout);

      this.broadcastPhase("creating", prompt, phaseEndsAt);
    } else {
      const timeout = 60_000;
      const phaseEndsAt = Date.now() + timeout;

      this.onStateChange({
        phase: { type: "voting" },
        votedPlayerIds: [],
        phaseEndsAt,
      });

      this.phaseTimer = setTimeout(() => {
        this.onPhaseTimeout();
      }, timeout);

      this.broadcastPhase("voting", undefined, phaseEndsAt);
    }
  }

  private onPhaseTimeout() {
    this.phaseTimer = null;
    if (!this.isHost || this.gameEnded) return;

    if (this.hostSubmissions.size < this.playerIds.length && this.hostVotes.size === 0) {
      this.fillMissingDrawings();
      this.advanceToVoting();
    } else if (this.hostVotes.size < this.playerIds.length) {
      this.advanceToResults();
    }
  }

  private fillMissingDrawings() {
    for (const pid of this.playerIds) {
      if (!this.hostSubmissions.has(pid)) {
        this.hostSubmissions.set(pid, []);
      }
    }
  }

  private advanceToVoting() {
    this.clearPhaseTimer();

    const submissionsArr: MasterpieceSubmission[] = [];
    for (const pid of this.playerIds) {
      const strokes = this.hostSubmissions.get(pid);
      if (strokes) {
        submissionsArr.push({ playerId: pid, strokes });
      }
    }

    const timeout = 60_000;
    const phaseEndsAt = Date.now() + timeout;

    for (const pid of this.playerIds) {
      if (pid === this.myId) {
        this.onStateChange({
          phase: { type: "voting" },
          submissions: submissionsArr,
          votedPlayerIds: [],
          votes: {},
          phaseEndsAt,
        });
      } else {
        this.sendTo(pid, {
          type: "masterpiece_phase",
          payload: {
            phase: "voting",
            submissions: submissionsArr,
            phaseEndsAt,
          },
        });
      }
    }

    this.phaseTimer = setTimeout(() => {
      this.onPhaseTimeout();
    }, timeout);
  }

  private advanceToResults() {
    this.clearPhaseTimer();
    this.gameEnded = true;

    const tally = new Map<string, number>();
    for (const pid of this.playerIds) {
      tally.set(pid, 0);
    }
    for (const [, targetId] of this.hostVotes) {
      tally.set(targetId, (tally.get(targetId) ?? 0) + 1);
    }

    const rankings = Array.from(tally.entries())
      .map(([playerId, votes]) => ({ playerId, votes }))
      .sort((a, b) => b.votes - a.votes);

    const submissionsArr: MasterpieceSubmission[] = [];
    for (const pid of this.playerIds) {
      const strokes = this.hostSubmissions.get(pid);
      if (strokes) {
        submissionsArr.push({ playerId: pid, strokes });
      }
    }

    for (const pid of this.playerIds) {
      if (pid === this.myId) {
        this.onStateChange({
          phase: { type: "results" },
          rankings,
          submissions: submissionsArr,
          phaseEndsAt: null,
        });
      } else {
        this.sendTo(pid, {
          type: "masterpiece_phase",
          payload: { phase: "results", rankings, submissions: submissionsArr },
        });
      }
    }

    this.onGameEnd?.();
  }

  /* ───── CLIENT ───── */

  private handleClientMessage(_senderId: string, msg: DataChannelMessage) {
    switch (msg.type) {
      case "masterpiece_phase": {
        const p = msg.payload;
        if (p.phase === "creating") {
          this.onStateChange({
            phase: { type: "creating" },
            prompt: p.prompt ?? "",
            submissions: [],
            submittedPlayerIds: [],
            phaseEndsAt: p.phaseEndsAt ?? null,
          });
        } else if (p.phase === "voting") {
          this.onStateChange({
            phase: { type: "voting" },
            submissions: p.submissions ?? [],
            votedPlayerIds: [],
            votes: {},
            phaseEndsAt: p.phaseEndsAt ?? null,
          });
        } else if (p.phase === "results") {
          this.onStateChange({
            phase: { type: "results" },
            rankings: p.rankings ?? null,
            submissions: p.submissions ?? [],
            phaseEndsAt: null,
          });
        }
        break;
      }
    }
  }

  /* ───── helpers ───── */

  private notifySubmissions() {
    this.onStateChange({
      submittedPlayerIds: Array.from(this.hostSubmissions.keys()),
    });
  }

  private notifyVotes() {
    this.onStateChange({
      votedPlayerIds: Array.from(this.hostVotes.keys()),
    });
  }

  private clearPhaseTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  broadcastPhase(phase: string, prompt?: string, phaseEndsAt?: number | null) {
    const raw = JSON.stringify({
      type: "masterpiece_phase",
      payload: { phase, prompt, phaseEndsAt: phaseEndsAt ?? undefined },
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
