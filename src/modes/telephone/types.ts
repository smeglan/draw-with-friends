import type { StrokeData, TelephoneChainLink } from "@/network/events";

export type TelephoneRoundConfig = {
  totalRounds: number;
};

export type TelephoneSubmission =
  | { type: "phrase"; content: string }
  | { type: "drawing"; content: StrokeData[] }
  | { type: "description"; content: string };

export type TelephoneGameState = {
  phase:
    | { type: "idle" }
    | { type: "writing_phrase" }
    | { type: "drawing" }
    | { type: "describing" }
    | { type: "waiting" }
    | { type: "reveal" };
  currentRound: number;
  totalRounds: number;
  phaseEndsAt: number | null;
  assignedPrompt:
    | { kind: "phrase"; content: string }
    | { kind: "description"; content: string }
    | { kind: "drawing"; content: StrokeData[] }
    | null;
  chains: TelephoneChainLink[][] | null;
  submittedPlayerIds: string[];
};

export type { TelephoneChainLink };
