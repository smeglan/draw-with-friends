import type { StrokeData } from "@/network/events";

export type MasterpieceSubmission = {
  playerId: string;
  strokes: StrokeData[];
};

export type MasterpieceGameState = {
  phase:
    | { type: "idle" }
    | { type: "creating" }
    | { type: "waiting" }
    | { type: "voting" }
    | { type: "results" };
  prompt: string;
  submissions: MasterpieceSubmission[];
  submittedPlayerIds: string[];
  votedPlayerIds: string[];
  votes: Record<string, string>;
  rankings: { playerId: string; votes: number }[] | null;
  phaseEndsAt: number | null;
};
