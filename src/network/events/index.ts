import type { GameModeId, ModeConfig, ModeSetupMethod, PromptProposal } from "@/modes/types";

export interface Player {
  id: string;
  username: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  players: Player[];
  hostId: string;
  hasPassword: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export type Point = {
  x: number;
  y: number;
};

export type StrokeData = {
  playerId: string;
  points: Point[];
  color: string;
  size: number;
  opacity: number;
  tool?: "brush" | "eraser";
};

export type TelephoneChainLink =
  | { kind: "phrase"; content: string; authorId: string }
  | { kind: "drawing"; content: StrokeData[]; authorId: string }
  | { kind: "description"; content: string; authorId: string };

export type GamePhase = "lobby" | "playing" | "results";

export type TelephonePhase =
  | { type: "idle" }
  | { type: "writing_phrase" }
  | { type: "drawing"; prompt: { kind: "phrase" | "description"; content: string } }
  | { type: "describing"; prompt: { kind: "drawing"; content: StrokeData[] } }
  | { type: "waiting" }
  | { type: "reveal" };

export type DataChannelMessage =
  | { type: "chat"; payload: ChatMessage }
  | { type: "stroke"; payload: StrokeData }
  | { type: "snapshot"; payload: { strokes: StrokeData[]; timestamp: number; playerId: string } }
  | { type: "undo"; payload: { playerId: string; timestamp: number } }
  | { type: "clear"; payload: { playerId: string; timestamp: number } }
  | { type: "vote_started"; payload: { candidates: string[] } }
  | { type: "vote_cast"; payload: { playerId: string; mode: string } }
  | { type: "vote_ended"; payload: { winner: string } }
  | { type: "setup_method_selected"; payload: { method: ModeSetupMethod } }
  | { type: "mode_selected"; payload: { mode: string } }
  | { type: "mode_config_updated"; payload: { mode: GameModeId; config: ModeConfig; version: number } }
  | { type: "mode_setup_reset"; payload: Record<string, never> }
  | { type: "masterpiece_prompt_proposed"; payload: { proposal: PromptProposal } }
  | { type: "masterpiece_prompt_vote_started"; payload: { candidates: PromptProposal[] } }
  | { type: "masterpiece_prompt_vote_cast"; payload: { playerId: string; proposalId: string } }
  | { type: "masterpiece_prompt_vote_ended"; payload: { winnerId: string; prompt: string; version: number } }
  | { type: "mode_reset"; payload: Record<string, never> }
  | { type: "ready_change"; payload: { playerId: string; ready: boolean } }
  | { type: "game_start"; payload: { mode: string; config: Record<string, unknown> } }
  | { type: "game_phase"; payload: { phase: GamePhase } }
  | { type: "game_end"; payload: { reason: string } }
  | { type: "telephone_phase"; payload: { phase: string; round?: number; totalRounds?: number; phaseEndsAt?: number } }
  | { type: "telephone_phrase_submit"; payload: { phrase: string } }
  | { type: "telephone_drawing_submit"; payload: { strokes: StrokeData[] } }
  | { type: "telephone_description_submit"; payload: { text: string } }
  | { type: "telephone_assigned"; payload: { kind: "phrase" | "drawing" | "description"; content: unknown } }
  | { type: "telephone_reveal"; payload: { chains: TelephoneChainLink[][] } }
  | { type: "telephone_all_submitted"; payload: { phase: string } }
  | { type: "telephone_config"; payload: { totalRounds: number } }
  | { type: "masterpiece_phase"; payload: { phase: string; prompt?: string; submissions?: { playerId: string; strokes: StrokeData[] }[]; rankings?: { playerId: string; votes: number }[]; phaseEndsAt?: number } }
  | { type: "masterpiece_drawing_submit"; payload: { strokes: StrokeData[] } }
  | { type: "masterpiece_vote_submit"; payload: { targetPlayerId: string } };

export interface SignalPayload {
  targetId: string;
  signal: unknown;
}

export interface IncomingSignal {
  senderId: string;
  signal: unknown;
}

export interface ClientToServerEvents {
  createRoom: (username: string, roomName?: string, password?: string) => void;
  joinRoom: (roomId: string, username: string, password?: string) => void;
  leaveRoom: () => void;
  signal: (data: SignalPayload) => void;
  getRoomStatus: () => void;
}

export interface ServerToClientEvents {
  roomCreated: (room: RoomInfo) => void;
  roomJoined: (room: RoomInfo) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  roomInfo: (room: RoomInfo) => void;
  hostChanged: (newHostId: string) => void;
  roomStatus: (room: RoomInfo) => void;
  signal: (data: IncomingSignal) => void;
  error: (message: string) => void;
}
