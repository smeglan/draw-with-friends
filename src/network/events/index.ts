export interface Player {
  id: string;
  username: string;
}

export interface RoomInfo {
  id: string;
  players: Player[];
  hostId: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export type DataChannelMessage =
  | { type: "chat"; payload: ChatMessage };

export interface SignalPayload {
  targetId: string;
  signal: unknown;
}

export interface IncomingSignal {
  senderId: string;
  signal: unknown;
}

export interface ClientToServerEvents {
  createRoom: (username: string) => void;
  joinRoom: (roomId: string, username: string) => void;
  signal: (data: SignalPayload) => void;
}

export interface ServerToClientEvents {
  roomCreated: (room: RoomInfo) => void;
  roomJoined: (room: RoomInfo) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  roomInfo: (room: RoomInfo) => void;
  signal: (data: IncomingSignal) => void;
  error: (message: string) => void;
}
