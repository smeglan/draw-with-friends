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
  roomSetup: {
    method: null,
    phase: "idle",
    selectedMode: null,
    config: null,
    configVersion: 0,
    readyPlayers: [],
    promptCandidates: [],
    promptVotes: {},
    promptWinnerId: null,
  },
  readyPlayers: [],
  gamePhase: "lobby",
  telephone: {
    phase: { type: "idle" },
    currentRound: 0,
    totalRounds: 4,
    phaseEndsAt: null,
    assignedPrompt: null,
    chains: null,
    submittedPlayerIds: [],
  },
  masterpiece: {
    phase: { type: "idle" },
    prompt: "",
    submissions: [],
    submittedPlayerIds: [],
    votedPlayerIds: [],
    votes: {},
    rankings: null,
    phaseEndsAt: null,
  },
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

  const restartGame = useCallback(() => {
    orchRef.current?.restartGame();
  }, []);

  const telephoneSubmitPhrase = useCallback((phrase: string) => {
    orchRef.current?.telephoneSubmitPhrase(phrase);
  }, []);

  const telephoneSubmitDrawing = useCallback((strokes: StrokeData[]) => {
    orchRef.current?.telephoneSubmitDrawing(strokes);
  }, []);

  const telephoneSubmitDescription = useCallback((text: string) => {
    orchRef.current?.telephoneSubmitDescription(text);
  }, []);

  const setTelephoneRounds = useCallback((rounds: number) => {
    orchRef.current?.setTelephoneRounds(rounds);
  }, []);

  const masterpieceSubmitDrawing = useCallback((strokes: StrokeData[]) => {
    orchRef.current?.masterpieceSubmitDrawing(strokes);
  }, []);

  const masterpieceSubmitVote = useCallback((targetPlayerId: string) => {
    orchRef.current?.masterpieceSubmitVote(targetPlayerId);
  }, []);

  const setMasterpiecePrompt = useCallback((prompt: string) => {
    orchRef.current?.setMasterpiecePrompt(prompt);
  }, []);

  const selectSetupMethod = useCallback((method: "host_configures" | "room_decides") => {
    orchRef.current?.selectSetupMethod(method);
  }, []);

  const submitMasterpiecePromptProposal = useCallback((text: string) => {
    orchRef.current?.submitMasterpiecePromptProposal(text);
  }, []);

  const startMasterpiecePromptVote = useCallback(() => {
    orchRef.current?.startMasterpiecePromptVote();
  }, []);

  const voteMasterpiecePrompt = useCallback((proposalId: string) => {
    orchRef.current?.voteMasterpiecePrompt(proposalId);
  }, []);

  const endMasterpiecePromptVote = useCallback(() => {
    orchRef.current?.endMasterpiecePromptVote();
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
    restartGame,
    telephoneSubmitPhrase,
    telephoneSubmitDrawing,
    telephoneSubmitDescription,
    setTelephoneRounds,
    masterpieceSubmitDrawing,
    masterpieceSubmitVote,
    setMasterpiecePrompt,
    selectSetupMethod,
    submitMasterpiecePromptProposal,
    startMasterpiecePromptVote,
    voteMasterpiecePrompt,
    endMasterpiecePromptVote,
    orchRef,
  };
}
