"use client";

import Link from "next/link";
import { useState, useCallback, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";
import { ConnectionDot } from "@/rooms/components/atoms/ConnectionDot";
import { PlayerSidebar } from "@/rooms/components/organisms/PlayerSidebar";
import { ModeSelectionModal } from "@/rooms/components/organisms/ModeSelectionModal";
import { RoomCanvas } from "@/rooms/components/organisms/RoomCanvas";
import { ChatBox } from "@/network/client/components/ChatBox";
import { useRoomOrchestrator } from "@/network/client/useRoomOrchestrator";
import { getAvailableModes } from "@/modes/registry";
import { getRoomPassword } from "@/shared/utils/roomPasswordStorage";
import { TelephoneGameView } from "@/modes/telephone/components/TelephoneGameView";
import { MasterpieceGameView } from "@/modes/masterpiece/components/MasterpieceGameView";
import type { GameModeId } from "@/modes/types";

type Props = {
  roomId: string;
};

export function RoomTemplate({ roomId }: Props) {
  const t = useTranslations();
  const { username, setUsername } = useUsername();
  const [roomPassword] = useState(() => getRoomPassword(roomId));
  const {
    state, sendChat, sendStroke, sendUndo,
    leaveRoom, startVote, castVote, endVote, hostSelectMode,
    changeMode, toggleReady, startGame, restartGame,
    telephoneSubmitPhrase, telephoneSubmitDrawing, telephoneSubmitDescription,
    masterpieceSubmitDrawing, masterpieceSubmitVote, setMasterpiecePrompt, setTelephoneRounds,
    selectSetupMethod, submitMasterpiecePromptProposal, startMasterpiecePromptVote,
    voteMasterpiecePrompt, endMasterpiecePromptVote,
  } = useRoomOrchestrator(
    roomId,
    username,
    roomPassword,
  );
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const showPrompt = !username && !dismissed && hydrated;
  const showChat = state.isJoined && state.players.length >= 2;
  const hostUsername = state.players.find((p) => p.id === state.hostId)?.username ?? null;
  const isHost = state.myId !== null && state.hostId !== null && state.myId === state.hostId;

  const activeMode: GameModeId | null =
    state.modeSelection.type === "host_picked" || state.modeSelection.type === "voting_complete"
      ? state.modeSelection.mode
      : null;

  const isTelephonePlaying = state.gamePhase === "playing" && activeMode === "telephone";
  const isMasterpiecePlaying = state.gamePhase === "playing" && activeMode === "masterpiece";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/room/${roomId}`;
    if (navigator.share) {
      navigator.share({ title: "Los Pibes Que Dibujan", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomId]);

  const handleStrokeComplete = useCallback((strokeData: Parameters<typeof sendStroke>[0]) => {
    sendStroke(strokeData);
  }, [sendStroke]);

  const handleSubmitPhrase = useCallback((phrase: string) => {
    telephoneSubmitPhrase(phrase);
  }, [telephoneSubmitPhrase]);

  const handleSubmitDrawing = useCallback((strokes: Parameters<typeof telephoneSubmitDrawing>[0]) => {
    telephoneSubmitDrawing(strokes);
  }, [telephoneSubmitDrawing]);

  const handleSubmitDescription = useCallback((text: string) => {
    telephoneSubmitDescription(text);
  }, [telephoneSubmitDescription]);

  const handleMasterpieceDrawing = useCallback((strokes: Parameters<typeof masterpieceSubmitDrawing>[0]) => {
    masterpieceSubmitDrawing(strokes);
  }, [masterpieceSubmitDrawing]);

  const handleMasterpieceVote = useCallback((targetPlayerId: string) => {
    masterpieceSubmitVote(targetPlayerId);
  }, [masterpieceSubmitVote]);

  const handleRestartGame = useCallback(() => {
    restartGame();
  }, [restartGame]);

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/lobby"
              onClick={leaveRoom}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
              title={t("room.exitRoomTitle")}
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
            </Link>
            <h1 className="text-sm font-medium text-white">{t("room.roomLabel", { id: roomId })}</h1>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
              title={copied ? t("common.copied") : t("room.copyRoomCode")}
            >
              {copied ? (
                <span className="text-xs font-medium text-green-400">OK</span>
              ) : (
                <Icon name="copy" className="h-4 w-4" />
              )}
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
              {state.peerStatus === "connected"
                ? isHost
                  ? "Host sync"
                  : "Live sync"
                : state.peerStatus === "connecting"
                  ? "Syncing"
                  : "Waiting"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
              title={t("room.shareRoom")}
            >
              <Icon name="share" className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
              <ConnectionDot connected={state.isConnected} />
              <span className="text-xs text-slate-200">{username || "—"}</span>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <PlayerSidebar
            players={state.players}
            hostId={state.hostId}
            isJoined={state.isJoined}
            error={state.error}
            isConnected={state.isConnected}
            peerStatus={state.peerStatus}
            roomId={roomId}
            myId={state.myId}
            isHost={isHost}
            modeSelection={state.modeSelection}
            readyPlayers={state.readyPlayers}
            onOpenModeSelection={() => setIsModeModalOpen(true)}
            onToggleReady={toggleReady}
            onStartGame={startGame}
            gamePhase={state.gamePhase}
          />

          {state.gamePhase === "results" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
              <p className="text-lg font-medium text-white">{t("room.sidebar.gameEnded")}</p>
              {isHost && (
                <button
                  type="button"
                  onClick={handleRestartGame}
                  className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-white transition hover:bg-cyan-400"
                >
                  {t("room.sidebar.restart")}
                </button>
              )}
              {!isHost && (
                <p className="text-sm text-slate-400">{t("room.sidebar.waitingRestart")}</p>
              )}
            </div>
          ) : isTelephonePlaying ? (
            <TelephoneGameView
              telephone={state.telephone}
              players={state.players}
              myId={state.myId}
              onSubmitPhrase={handleSubmitPhrase}
              onSubmitDrawing={handleSubmitDrawing}
              onSubmitDescription={handleSubmitDescription}
            />
          ) : isMasterpiecePlaying ? (
            <MasterpieceGameView
              masterpiece={state.masterpiece}
              players={state.players}
              myId={state.myId}
              onSubmitDrawing={handleMasterpieceDrawing}
              onSubmitVote={handleMasterpieceVote}
            />
          ) : (
            <div className="flex flex-1 flex-col">
              <RoomCanvas
                strokes={state.strokes}
                onStrokeComplete={handleStrokeComplete}
                myId={state.myId}
                hostId={state.hostId}
                onUndo={sendUndo}
                peerStatus={state.peerStatus}
              />
            </div>
          )}

          {showChat && (
            <div className="w-full shrink-0 border-t border-white/10 lg:w-80 lg:border-l lg:border-t-0">
              <ChatBox
                messages={state.messages}
                onSend={sendChat}
                isConnected={state.peerStatus === "connected"}
                currentUsername={username}
                hostUsername={hostUsername}
              />
            </div>
          )}
        </div>
      </div>

      <ModeSelectionModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        modeSelection={state.modeSelection}
        isHost={isHost}
        playerCount={state.players.length}
        myPlayerId={state.myId ?? ""}
        onHostSelect={hostSelectMode}
        onStartVote={() => startVote(getAvailableModes(state.players.length).map((m) => m.id))}
        onVote={castVote}
        onEndVote={endVote}
        onChangeMode={changeMode}
        masterpiecePrompt={state.masterpiece.prompt}
        onSetMasterpiecePrompt={setMasterpiecePrompt}
        telephoneRounds={state.telephone.totalRounds}
        onSetTelephoneRounds={setTelephoneRounds}
        roomSetup={state.roomSetup}
        onSelectSetupMethod={selectSetupMethod}
        onSubmitMasterpiecePromptProposal={submitMasterpiecePromptProposal}
        onStartMasterpiecePromptVote={startMasterpiecePromptVote}
        onVoteMasterpiecePrompt={voteMasterpiecePrompt}
        onEndMasterpiecePromptVote={endMasterpiecePromptVote}
      />

      {showPrompt && (
        <NamePrompt
          onSubmit={(name) => {
            setUsername(name);
            setDismissed(true);
          }}
        />
      )}
    </>
  );
}
