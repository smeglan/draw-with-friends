"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "./SocketProvider";
import { RoomOrchestrator, type OrchestratorState } from "./RoomOrchestrator";
import type { StrokeData } from "@/network/events";

const INITIAL: OrchestratorState = {
  players: [],
  hostId: null,
  myId: null,
  isJoined: false,
  error: null,
  isConnected: false,
  peerStatus: "idle",
  messages: [],
  strokes: [],
};

export function useRoomOrchestrator(
  roomId: string,
  username: string | null,
  password?: string | null,
  enabled = true,
) {
  const { socket } = useSocket();
  const [state, setState] = useState<OrchestratorState>(INITIAL);
  const orchRef = useRef<RoomOrchestrator | null>(null);

  useEffect(() => {
    if (!username || !enabled) return;

    const orch = new RoomOrchestrator(socket);
    orchRef.current = orch;

    const unsub = orch.subscribe(() => {
      setState({ ...orch.state });
    });

    orch.start(roomId, username, password ?? undefined);

    return () => {
      unsub();
      orch.destroy();
      orchRef.current = null;
    };
  }, [enabled, roomId, username, password, socket]);

  const sendChat = useCallback((text: string) => {
    orchRef.current?.sendChat(text);
  }, []);

  const sendStroke = useCallback((stroke: StrokeData) => {
    orchRef.current?.sendStroke(stroke);
  }, []);

  const sendUndo = useCallback(() => {
    orchRef.current?.sendUndo();
  }, []);

  const sendClear = useCallback(() => {
    orchRef.current?.sendClear();
  }, []);

  const leaveRoom = useCallback(() => {
    orchRef.current?.leaveRoom();
  }, []);

  return { state, sendChat, sendStroke, sendUndo, sendClear, leaveRoom, orchRef };
}
