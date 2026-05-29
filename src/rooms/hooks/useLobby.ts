"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/network/client/SocketProvider";
import { useUsername } from "@/shared/context/UsernameContext";
import type { RoomInfo } from "@/network/events";

type Action = "create" | "join" | null;

export function useLobby() {
  const router = useRouter();
  const { socket } = useSocket();
  const { username } = useUsername();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const actionRef = useRef<Action>(null);

  useEffect(() => {
    function onRoomCreated(room: RoomInfo) {
      if (actionRef.current !== "create") return;
      actionRef.current = null;
      setIsLoading(false);
      router.push(`/room/${room.id}`);
    }

    function onRoomJoined(room: RoomInfo) {
      if (actionRef.current !== "join") return;
      actionRef.current = null;
      setIsLoading(false);
      router.push(`/room/${room.id}`);
    }

    function onError(msg: string) {
      if (!actionRef.current) return;
      actionRef.current = null;
      setIsLoading(false);
      setError(msg);
    }

    socket.on("roomCreated", onRoomCreated);
    socket.on("roomJoined", onRoomJoined);
    socket.on("error", onError);

    return () => {
      socket.off("roomCreated", onRoomCreated);
      socket.off("roomJoined", onRoomJoined);
      socket.off("error", onError);
    };
  }, [socket, router]);

  const createRoom = useCallback(() => {
    setError(null);
    setIsLoading(true);
    actionRef.current = "create";
    socket.emit("createRoom", username);
  }, [socket, username]);

  const joinRoom = useCallback(
    (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return;
      setError(null);
      setIsLoading(true);
      actionRef.current = "join";
      socket.emit("joinRoom", trimmed, username);
    },
    [socket, username],
  );

  return { createRoom, joinRoom, error, isLoading };
}
