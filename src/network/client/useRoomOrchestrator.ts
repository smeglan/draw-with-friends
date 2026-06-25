"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "./SocketProvider";
import { RoomOrchestrator, type OrchestratorState } from "./RoomOrchestrator";
import type { StrokeData } from "@/network/events";
import type { GameModeId } from "@/modes/types";

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
  modeSelection: { type: "none" },
  readyPlayers: [],
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

  const startVote = useCallback((candidates: GameModeId[]) => {
    orchRef.current?.startVote(candidates);
  }, []);

  const castVote = useCallback((mode: GameModeId) => {
    orchRef.current?.castVote(mode);
  }, []);

  const endVote = useCallback(() => {
    orchRef.current?.endVote();
  }, []);

  const hostSelectMode = useCallback((mode: GameModeId) => {
    orchRef.current?.hostSelectMode(mode);
  }, []);

  const changeMode = useCallback(() => {
    orchRef.current?.changeMode();
  }, []);

  const toggleReady = useCallback(() => {
    orchRef.current?.toggleReady();
  }, []);

  const startGame = useCallback(() => {
    orchRef.current?.startGame();
  }, []);

  return {
    state,
    sendChat,
    sendStroke,
    sendUndo,
    sendClear,
    leaveRoom,
    startVote,
    castVote,
    endVote,
    hostSelectMode,
    changeMode,
    toggleReady,
    startGame,
    orchRef,
  };
}
