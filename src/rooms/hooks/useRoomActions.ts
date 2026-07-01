"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/network/client/SocketProvider";
import { useUsername } from "@/shared/context/UsernameContext";
import { setRoomPassword } from "@/shared/utils/roomPasswordStorage";
import type { RoomInfo } from "@/network/events";

type Action = "create" | "join" | null;

export function useRoomActions() {
  const router = useRouter();
  const { socket } = useSocket();
  const { username } = useUsername();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const actionRef = useRef<Action>(null);
  const pendingPasswordRef = useRef<string | null>(null);

  useEffect(() => {
    function onRoomCreated(room: RoomInfo) {
      if (actionRef.current !== "create") return;
      actionRef.current = null;
      setIsLoading(false);
      setRoomPassword(room.id, pendingPasswordRef.current ?? "");
      router.push(`/room/${room.id}`);
    }

    function onRoomJoined(room: RoomInfo) {
      if (actionRef.current !== "join") return;
      actionRef.current = null;
      setIsLoading(false);
      setRoomPassword(room.id, pendingPasswordRef.current ?? "");
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

  const createRoom = useCallback(
    (roomName?: string, password?: string) => {
      setError(null);
      setIsLoading(true);
      actionRef.current = "create";
      pendingPasswordRef.current = password ?? null;
      if (password) {
        socket.emit("createRoom", username, roomName, password);
      } else {
        socket.emit("createRoom", username, roomName);
      }
    },
    [socket, username],
  );

  const joinRoom = useCallback(
    (code: string, password?: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return;
      setError(null);
      setIsLoading(true);
      actionRef.current = "join";
      pendingPasswordRef.current = password ?? null;
      if (password) {
        socket.emit("joinRoom", trimmed, username, password);
      } else {
        socket.emit("joinRoom", trimmed, username);
      }
    },
    [socket, username],
  );

  return { createRoom, joinRoom, error, isLoading };
}
