"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { GameModeId, ModeSelectionState } from "@/modes/types";
import { ModeSelector } from "@/modes/components/ModeSelector";
import { VotePanel } from "@/modes/components/VotePanel";
import { ActiveModeBanner } from "@/modes/components/ActiveModeBanner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  modeSelection: ModeSelectionState;
  isHost: boolean;
  playerCount: number;
  myPlayerId: string;
  onHostSelect: (mode: GameModeId) => void;
  onStartVote: () => void;
  onVote: (mode: GameModeId) => void;
  onEndVote: () => void;
  onChangeMode: () => void;
};

export function ModeSelectionModal({
  isOpen,
  onClose,
  modeSelection,
  isHost,
  playerCount,
  myPlayerId,
  onHostSelect,
  onStartVote,
  onVote,
  onEndVote,
  onChangeMode,
}: Props) {
  const t = useTranslations();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        <div className="max-h-[70vh] overflow-y-auto">
          {modeSelection.type === "none" && isHost && (
            <ModeSelector
              playerCount={playerCount}
              onSelect={(mode) => {
                onHostSelect(mode);
                onClose();
              }}
              onStartVote={onStartVote}
            />
          )}

          {modeSelection.type === "none" && !isHost && (
            <div className="flex flex-col items-center gap-4 py-12">
              <span className="text-5xl">🎮</span>
              <p className="text-sm text-slate-400">{t("modes.hostChoosing")}</p>
              <div className="morph-rectangle h-10 w-3/4 rounded-xl border border-cyan-500/30 bg-cyan-500/5" />
            </div>
          )}

          {modeSelection.type === "voting" && (
            <VotePanel
              candidates={modeSelection.candidates}
              votes={modeSelection.votes}
              myPlayerId={myPlayerId}
              isHost={isHost}
              onVote={onVote}
              onEndVote={onEndVote}
            />
          )}

          {(modeSelection.type === "host_picked" || modeSelection.type === "voting_complete") && (
            <div className="flex flex-col gap-4">
              <ActiveModeBanner
                mode={modeSelection.mode}
                isHost={isHost}
                onChangeMode={() => {
                  onChangeMode();
                  onClose();
                }}
              />
              <p className="text-xs text-slate-500">{t("room.sidebar.waitingPlayers")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
