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
};

export type DataChannelMessage =
  | { type: "chat"; payload: ChatMessage }
  | { type: "stroke"; payload: StrokeData }
  | { type: "snapshot"; payload: { strokes: StrokeData[]; timestamp: number; playerId: string } }
  | { type: "undo"; payload: { playerId: string; timestamp: number } }
  | { type: "clear"; payload: { playerId: string; timestamp: number } };

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
