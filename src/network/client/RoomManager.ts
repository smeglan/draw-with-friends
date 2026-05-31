"use client";

import type { TypedSocket } from "./index";
import type { Player, RoomInfo } from "@/network/events";

export interface RoomManagerState {
  players: Player[];
  hostId: string | null;
  myId: string | null;
  isJoined: boolean;
  error: string | null;
  isConnected: boolean;
}

export type RoomEventListener = () => void;

export class RoomManager {
  private _state: RoomManagerState = {
    players: [],
    hostId: null,
    myId: null,
    isJoined: false,
    error: null,
    isConnected: false,
  };

  private listeners = new Set<RoomEventListener>();
  private socket: TypedSocket;

  constructor(socket: TypedSocket) {
    this.socket = socket;
  }

  get state(): RoomManagerState {
    return this._state;
  }

  subscribe(cb: RoomEventListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private setState(partial: Partial<RoomManagerState>) {
    this._state = { ...this._state, ...partial };
    this.notify();
  }

  join(roomId: string, username: string) {
    if (!username) return;

    this.setState({ error: null });
    this.socket.emit("joinRoom", roomId, username);
  }

  private onRoomJoined = (room: RoomInfo) => {
    this.setState({
      players: room.players,
      hostId: room.hostId,
      myId: this.socket.id ?? null,
      isJoined: true,
    });
  };

  private onPlayerJoined = (player: Player) => {
    this.setState({
      players: this._state.players.find((p) => p.id === player.id)
        ? this._state.players
        : [...this._state.players, player],
    });
  };

  private onPlayerLeft = (playerId: string) => {
    this.setState({
      players: this._state.players.filter((p) => p.id !== playerId),
    });
  };

  private onError = (message: string) => {
    this.setState({ error: message, isJoined: false });
  };

  private onConnect = () => {
    this.setState({ isConnected: true });
  };

  private onDisconnect = () => {
    this.setState({ isConnected: false, isJoined: false });
  };

  attach() {
    this.socket.on("roomJoined", this.onRoomJoined);
    this.socket.on("playerJoined", this.onPlayerJoined);
    this.socket.on("playerLeft", this.onPlayerLeft);
    this.socket.on("error", this.onError);
    this.socket.on("connect", this.onConnect);
    this.socket.on("disconnect", this.onDisconnect);

    if (this.socket.connected) {
      this.setState({ isConnected: true });
    }
  }

  detach() {
    this.socket.off("roomJoined", this.onRoomJoined);
    this.socket.off("playerJoined", this.onPlayerJoined);
    this.socket.off("playerLeft", this.onPlayerLeft);
    this.socket.off("error", this.onError);
    this.socket.off("connect", this.onConnect);
    this.socket.off("disconnect", this.onDisconnect);
  }

  destroy() {
    this.detach();
    this.listeners.clear();
  }
}
