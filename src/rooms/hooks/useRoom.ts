"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/network/client/SocketProvider";
import { useUsername } from "@/shared/context/UsernameContext";
import type { Player, RoomInfo } from "@/network/events";

export function useRoom(roomId: string, password?: string) {
  const { socket, isConnected } = useSocket();
  const { username } = useUsername();
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (!username || !isConnected) return;

    socket.emit("joinRoom", roomId, username, password);

    function onRoomJoined(room: RoomInfo) {
      setError(null);
      setPlayers(room.players);
      setIsJoined(true);
    }

    function onPlayerJoined(player: Player) {
      setPlayers((prev) => (prev.find((p) => p.id === player.id) ? prev : [...prev, player]));
    }

    function onPlayerLeft(playerId: string) {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }

    function onDisconnect() {
      setIsJoined(false);
    }

    function onError(msg: string) {
      setError(msg);
      setIsJoined(false);
    }

    socket.on("roomJoined", onRoomJoined);
    socket.on("playerJoined", onPlayerJoined);
    socket.on("playerLeft", onPlayerLeft);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);

    return () => {
      socket.off("roomJoined", onRoomJoined);
      socket.off("playerJoined", onPlayerJoined);
      socket.off("playerLeft", onPlayerLeft);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
    };
  }, [roomId, username, password, isConnected, socket]);

  return { players, isJoined, error, isConnected };
}
