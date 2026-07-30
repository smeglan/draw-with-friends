import type { IconName } from "@/shared/icons";

export type GameModeId = "masterpiece" | "fusion" | "telephone" | "pictionary";

/** Determines who owns the mode and configuration decisions in the lobby. */
export type ModeSetupMethod = "host_configures" | "room_decides";

export type RoomSetupPhase =
  | "idle"
  | "mode_voting"
  | "mode_selected"
  | "configuring"
  | "config_voting"
  | "configured"
  | "ready";

export type PromptSource = "host" | "room_vote";

export type MasterpieceModeConfig = {
  mode: "masterpiece";
  promptSource: PromptSource;
  prompt: string;
};

export type TelephoneModeConfig = {
  mode: "telephone";
  preset: "quick" | "normal" | "long";
  totalRounds: number;
};

export type PictionaryModeConfig = {
  mode: "pictionary";
  preset: "quick" | "normal" | "long";
};

export type FusionModeConfig = {
  mode: "fusion";
  preset: "default";
};

export type ModeConfig =
  | MasterpieceModeConfig
  | TelephoneModeConfig
  | PictionaryModeConfig
  | FusionModeConfig;

export type RoomSetupState = {
  method: ModeSetupMethod | null;
  phase: RoomSetupPhase;
  selectedMode: GameModeId | null;
  config: ModeConfig | null;
  configVersion: number;
  readyPlayers: string[];
  promptCandidates: PromptProposal[];
  promptVotes: Record<string, string>;
  promptWinnerId: string | null;
};

export type PromptProposal = {
  id: string;
  playerId: string;
  text: string;
};

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
