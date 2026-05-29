"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/network/client/SocketProvider";
import { useUsername } from "@/shared/context/UsernameContext";
import type { Player, RoomInfo } from "@/network/events";

export function useRoom(roomId: string) {
  const { socket, isConnected } = useSocket();
  const { username } = useUsername();
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (!username || !isConnected) return;

    setError(null);

    socket.emit("joinRoom", roomId, username);

    function onRoomJoined(room: RoomInfo) {
      setPlayers(room.players);
      setIsJoined(true);
    }

    function onPlayerJoined(player: Player) {
      setPlayers((prev) => (prev.find((p) => p.id === player.id) ? prev : [...prev, player]));
    }

    function onPlayerLeft(playerId: string) {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }

    function onError(msg: string) {
      setError(msg);
      setIsJoined(false);
    }

    socket.on("roomJoined", onRoomJoined);
    socket.on("playerJoined", onPlayerJoined);
    socket.on("playerLeft", onPlayerLeft);
    socket.on("error", onError);

    return () => {
      socket.off("roomJoined", onRoomJoined);
      socket.off("playerJoined", onPlayerJoined);
      socket.off("playerLeft", onPlayerLeft);
      socket.off("error", onError);
    };
  }, [roomId, username, isConnected, socket]);

  useEffect(() => {
    if (!isConnected) {
      setIsJoined(false);
    }
  }, [isConnected]);

  return { players, isJoined, error, isConnected };
}
