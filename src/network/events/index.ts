export interface Player {
  id: string;
  username: string;
}

export interface RoomInfo {
  id: string;
  players: Player[];
  hostId: string;
}

export interface ClientToServerEvents {
  createRoom: (username: string) => void;
  joinRoom: (roomId: string, username: string) => void;
}

export interface ServerToClientEvents {
  roomCreated: (room: RoomInfo) => void;
  roomJoined: (room: RoomInfo) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  roomInfo: (room: RoomInfo) => void;
  error: (message: string) => void;
}
