import type { IconName } from "@/shared/icons";

export type GameModeId = "masterpiece" | "fusion" | "telephone" | "pictionary";

export type GameModeInfo = {
  id: GameModeId;
  nameKey: string;
  descriptionKey: string;
  icon: IconName;
  minPlayers: number;
};

export type ModeSelectionState =
  | { type: "none" }
  | { type: "host_picked"; mode: GameModeId }
  | { type: "voting"; candidates: GameModeId[]; votes: Record<string, GameModeId> }
  | { type: "voting_complete"; mode: GameModeId };
