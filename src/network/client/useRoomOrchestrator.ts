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

export function useRoomOrchestrator(roomId: string, username: string | null) {
  const { socket } = useSocket();
  const [state, setState] = useState<OrchestratorState>(INITIAL);
  const orchRef = useRef<RoomOrchestrator | null>(null);

  useEffect(() => {
    if (!username) return;

    const orch = new RoomOrchestrator(socket);
    orchRef.current = orch;

    const unsub = orch.subscribe(() => {
      setState({ ...orch.state });
    });

    orch.start(roomId, username);

    return () => {
      unsub();
      orch.destroy();
      orchRef.current = null;
    };
  }, [roomId, username, socket]);

  const sendChat = useCallback((text: string) => {
    orchRef.current?.sendChat(text);
  }, []);

  const sendStroke = useCallback((stroke: StrokeData) => {
    orchRef.current?.sendStroke(stroke);
  }, []);

  const onStroke = useCallback((cb: (stroke: StrokeData) => void) => {
    if (!orchRef.current) return () => {};
    return orchRef.current.onStroke(cb);
  }, []);

  return { state, sendChat, sendStroke, onStroke, orchRef };
}
