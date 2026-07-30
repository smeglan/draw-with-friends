"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { GameModeId, ModeSelectionState, ModeSetupMethod, RoomSetupState } from "@/modes/types";
import { ModeSelector } from "@/modes/components/ModeSelector";
import { ModeConfigurationPanel } from "@/modes/components/ModeConfigurationPanel";
import { VotePanel } from "@/modes/components/VotePanel";
import { ActiveModeBanner } from "@/modes/components/ActiveModeBanner";
import { PromptVotePanel } from "@/modes/components/PromptVotePanel";

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
  masterpiecePrompt?: string;
  onSetMasterpiecePrompt?: (value: string) => void;
  telephoneRounds?: number;
  onSetTelephoneRounds?: (value: number) => void;
  roomSetup: RoomSetupState;
  onSelectSetupMethod: (method: ModeSetupMethod) => void;
  onSubmitMasterpiecePromptProposal: (text: string) => void;
  onStartMasterpiecePromptVote: () => void;
  onVoteMasterpiecePrompt: (proposalId: string) => void;
  onEndMasterpiecePromptVote: () => void;
};

function isActiveSelection(selection: ModeSelectionState): selection is Extract<ModeSelectionState, { type: "host_picked" | "voting_complete" }> {
  return selection.type === "host_picked" || selection.type === "voting_complete";
}

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
  masterpiecePrompt,
  onSetMasterpiecePrompt,
  telephoneRounds = 4,
  onSetTelephoneRounds,
  roomSetup,
  onSelectSetupMethod,
  onSubmitMasterpiecePromptProposal,
  onStartMasterpiecePromptVote,
  onVoteMasterpiecePrompt,
  onEndMasterpiecePromptVote,
}: Props) {
  const t = useTranslations();
  const [setupMethod, setSetupMethod] = useState<ModeSetupMethod | null>(null);
  const [draftMode, setDraftMode] = useState<GameModeId | null>(null);
  const [draftPrompt, setDraftPrompt] = useState(masterpiecePrompt ?? "");
  const [draftRounds, setDraftRounds] = useState(telephoneRounds);

  const activeMode = isActiveSelection(modeSelection) ? modeSelection.mode : null;

  useEffect(() => {
    if (!isOpen) return;
    if (modeSelection.type === "none") {
      setSetupMethod(null);
      setDraftMode(null);
      setDraftPrompt(masterpiecePrompt ?? "");
      setDraftRounds(telephoneRounds);
    }
  }, [isOpen, modeSelection.type, masterpiecePrompt, telephoneRounds]);

  useEffect(() => {
    if (activeMode) setDraftMode(activeMode);
  }, [activeMode]);

  useEffect(() => {
    if (roomSetup.method) setSetupMethod(roomSetup.method);
  }, [roomSetup.method]);

  useEffect(() => {
    if (modeSelection.type === "host_picked" || modeSelection.type === "voting_complete") {
      setDraftPrompt(masterpiecePrompt ?? "");
      setDraftRounds(telephoneRounds);
    }
  }, [modeSelection.type, masterpiecePrompt, telephoneRounds]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const setupStatus = modeSelection.type === "voting"
    ? t("modes.configuration.status.votingMode")
    : roomSetup.phase === "config_voting"
      ? t("modes.configuration.status.votingPrompt")
      : roomSetup.phase === "configuring"
        ? (isHost
          ? t("modes.configuration.status.configureNow")
          : t("modes.configuration.status.waitingConfiguration"))
        : isActiveSelection(modeSelection) && roomSetup.phase === "configured"
          ? t("modes.configuration.status.configured")
          : null;

  const updatePrompt = (value: string, committed: boolean) => {
    setDraftPrompt(value);
    if (committed) onSetMasterpiecePrompt?.(value);
  };

  const updateRounds = (value: number, committed: boolean) => {
    const safeValue = Math.min(10, Math.max(1, value || 1));
    setDraftRounds(safeValue);
    if (committed) onSetTelephoneRounds?.(safeValue);
  };

  const confirmHostSetup = () => {
    if (!draftMode) return;
    if (draftMode === "masterpiece") onSetMasterpiecePrompt?.(draftPrompt);
    if (draftMode === "telephone") onSetTelephoneRounds?.(draftRounds);
    onHostSelect(draftMode);
    onClose();
  };

  const chooseRoomDecides = () => {
    setSetupMethod("room_decides");
    onSelectSetupMethod("room_decides");
    onStartVote();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
          aria-label={t("common.close")}
        >
          ×
        </button>

        <div className="mb-5 pr-10">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-cyan-400">{t("modes.heading")}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{t("modes.configuration.modalTitle")}</h2>
          <p className="mt-1 text-sm text-slate-400">{t("modes.configuration.modalHint")}</p>
          {setupStatus && (
            <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200">
              {setupStatus}
            </div>
          )}
        </div>

        {modeSelection.type === "none" && isHost && !setupMethod && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setSetupMethod("host_configures");
                onSelectSetupMethod("host_configures");
              }}
              className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-left transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
            >
              <p className="text-base font-semibold text-white">{t("modes.configuration.hostChoice")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{t("modes.configuration.hostChoiceHint")}</p>
            </button>
            <button
              type="button"
              onClick={chooseRoomDecides}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/20 hover:bg-white/10"
            >
              <p className="text-base font-semibold text-white">{t("modes.configuration.roomChoice")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{t("modes.configuration.roomChoiceHint")}</p>
            </button>
          </div>
        )}

        {modeSelection.type === "none" && !isHost && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="text-5xl">🎮</span>
            <p className="text-sm text-slate-400">{t("modes.hostChoosing")}</p>
            <div className="morph-rectangle h-10 w-3/4 rounded-xl border border-cyan-500/30 bg-cyan-500/5" />
          </div>
        )}

        {modeSelection.type === "none" && isHost && setupMethod === "host_configures" && (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <ModeSelector
                playerCount={playerCount}
                selectedMode={draftMode}
                onSelect={setDraftMode}
                onStartVote={chooseRoomDecides}
              />
              <ModeConfigurationPanel
                mode={draftMode}
                isHost
                masterpiecePrompt={draftPrompt}
                telephoneRounds={draftRounds}
                onMasterpiecePromptChange={(value) => updatePrompt(value, false)}
                onTelephoneRoundsChange={(value) => updateRounds(value, false)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSetupMethod(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
                {t("common.back")}
              </button>
              <button type="button" disabled={!draftMode} onClick={confirmHostSetup} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">
                {t("modes.configuration.confirm")}
              </button>
            </div>
          </>
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

        {isActiveSelection(modeSelection) && (
          <div className="flex flex-col gap-4">
            <ActiveModeBanner mode={modeSelection.mode} isHost={isHost} onChangeMode={onChangeMode} />
            {modeSelection.mode === "masterpiece" &&
            roomSetup.method === "room_decides" &&
            (roomSetup.phase === "configuring" || roomSetup.phase === "config_voting") ? (
              <PromptVotePanel
                candidates={roomSetup.promptCandidates}
                votes={roomSetup.promptVotes}
                myPlayerId={myPlayerId}
                isHost={isHost}
                isVoting={roomSetup.phase === "config_voting"}
                onSubmitProposal={onSubmitMasterpiecePromptProposal}
                onStartVote={onStartMasterpiecePromptVote}
                onVote={onVoteMasterpiecePrompt}
                onEndVote={onEndMasterpiecePromptVote}
              />
            ) : (
              <ModeConfigurationPanel
                mode={modeSelection.mode}
                isHost={isHost && (roomSetup.method !== "room_decides" || modeSelection.mode === "telephone")}
                masterpiecePrompt={masterpiecePrompt ?? draftPrompt}
                telephoneRounds={telephoneRounds}
                onMasterpiecePromptChange={(value) => updatePrompt(value, true)}
                onTelephoneRoundsChange={(value) => updateRounds(value, true)}
              />
            )}
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-400">
                {t("common.done")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
