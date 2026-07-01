"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Player, GamePhase } from "@/network/events";
import type { PeerStatus } from "@/network/client/PeerManager";
import type { ModeSelectionState, GameModeId } from "@/modes/types";
import { ConnectionDot } from "@/rooms/components/atoms/ConnectionDot";
import { PlayerList } from "@/rooms/components/molecules/PlayerList";
import { ModeSelector } from "@/modes/components/ModeSelector";
import { VotePanel } from "@/modes/components/VotePanel";
import { ActiveModeBanner } from "@/modes/components/ActiveModeBanner";

type Props = {
  players: Player[];
  hostId: string | null;
  isConnected: boolean;
  isJoined: boolean;
  error: string | null;
  peerStatus: PeerStatus;
  roomId: string;
  myId: string | null;
  isHost: boolean;
  modeSelection: ModeSelectionState;
  readyPlayers: string[];
  onStartVote: () => void;
  onVote: (mode: GameModeId) => void;
  onEndVote: () => void;
  onHostSelect: (mode: GameModeId) => void;
  onChangeMode: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  gamePhase?: GamePhase;
};

export function PlayerSidebar({
  players,
  hostId,
  isConnected,
  isJoined,
  error,
  peerStatus,
  roomId,
  myId,
  isHost,
  modeSelection,
  readyPlayers,
  onStartVote,
  onVote,
  onEndVote,
  onHostSelect,
  onChangeMode,
  onToggleReady,
  onStartGame,
  gamePhase = "lobby",
}: Props) {
  const t = useTranslations();
  const playerCount = players.length;
  const canPlay = playerCount >= 2;
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const isReady = myId ? readyPlayers.includes(myId) : false;
  const isPlaying = gamePhase === "playing";
  const statusLabel =
    peerStatus === "connected"
      ? t("room.sidebar.statusLive")
      : peerStatus === "connecting"
        ? t("room.sidebar.statusSyncing")
        : peerStatus === "error"
          ? t("room.sidebar.statusError")
          : peerStatus === "disconnected"
            ? t("room.sidebar.statusOffline")
            : t("room.sidebar.statusIdle");

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-white/10 bg-white/[0.02] p-4 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <ConnectionDot connected={isConnected} />
        <span className="text-xs text-slate-400">{t("room.sidebar.roomLabel")}</span>
        <span className="font-mono text-sm font-medium text-white">{roomId}</span>
        <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-slate-300">
          {statusLabel}
        </span>
      </div>

      {!isConnected && (
        <div className="rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-400">
          {t("room.sidebar.disconnected")}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-400/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {isConnected && !isJoined && !error && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-400" />
          {t("room.sidebar.joining")}
        </div>
      )}

      {isJoined && (
        <>
          {!isPlaying && (
            <div>
              <p className="mb-1 text-sm text-slate-300">
                {canPlay ? t("room.sidebar.readyToPlay") : t("room.sidebar.waitingPlayers")}
              </p>
              <p className="text-xs text-slate-500">
                {t("room.sidebar.playerCount", { count: playerCount })}
                {!canPlay && t("room.sidebar.minPlayers")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {peerStatus === "idle" && t("room.sidebar.waitingP2P")}
                {peerStatus === "connecting" && t("room.sidebar.connectingP2P")}
                {peerStatus === "connected" && (
                  <span className="text-green-400">{t("room.sidebar.p2pEstablished")}</span>
                )}
                {peerStatus === "disconnected" && (
                  <span className="text-red-400">{t("room.sidebar.p2pLost")}</span>
                )}
                {peerStatus === "error" && (
                  <span className="text-red-400">{t("room.sidebar.p2pError")}</span>
                )}
              </p>
            </div>
          )}

          {isPlaying && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-3 py-2">
              <p className="text-xs font-medium text-cyan-300">{t("room.sidebar.gameInProgress")}</p>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
            <PlayerList players={players} hostId={hostId} />
            {!isPlaying && modeSelection.type === "none" && !isHost && (
              <div className="mt-2 flex flex-col items-center gap-2 border-t border-white/10 pt-3">
                <p className="text-xs text-slate-400">{t("modes.hostChoosing")}</p>
                <div className="morph-rectangle h-8 w-3/4 rounded-xl border border-cyan-500/30 bg-cyan-500/5" />
              </div>
            )}
          </div>

          {!isPlaying && (
            <>
              <div className="border-t border-white/10 pt-3">
                {modeSelection.type === "none" && isHost && (
                  <ModeSelector
                    playerCount={playerCount}
                    onSelect={onHostSelect}
                    onStartVote={onStartVote}
                  />
                )}
                {modeSelection.type === "voting" && (
                  <VotePanel
                    candidates={modeSelection.candidates}
                    votes={modeSelection.votes}
                    myPlayerId={myId ?? ""}
                    isHost={isHost}
                    onVote={onVote}
                    onEndVote={onEndVote}
                  />
                )}
                {(modeSelection.type === "host_picked" || modeSelection.type === "voting_complete") && (
                  <div className="flex flex-col gap-2">
                    <ActiveModeBanner
                      mode={modeSelection.mode}
                      isHost={isHost}
                      onChangeMode={onChangeMode}
                    />
                    <p className="text-xs text-slate-500">{t("room.sidebar.waitingPlayers")}</p>
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-2 lg:sticky lg:bottom-4">
                {showStartConfirm && (
                  <div className="flex flex-col gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                    <p className="text-xs text-amber-400">
                      {t("modes.startConfirm", { count: playerCount - readyPlayers.length })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { onStartGame(); setShowStartConfirm(false); }}
                        className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-400"
                      >
                        {t("modes.startConfirmYes")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowStartConfirm(false)}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10"
                      >
                        {t("modes.startConfirmNo")}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isHost && isReady) {
                      const missing = playerCount - readyPlayers.length;
                      if (missing > 0) {
                        setShowStartConfirm(true);
                        return;
                      }
                      onStartGame();
                      return;
                    }
                    onToggleReady();
                  }}
                  className={[
                    "w-full rounded-xl px-6 py-3 font-medium transition",
                    isReady
                      ? "bg-green-500 text-white hover:bg-green-400"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isReady ? t("room.sidebar.readyCheck") : t("room.sidebar.ready")}
                    <span className="text-[11px] opacity-70">
                      {t("modes.readyCount", { ready: readyPlayers.length, total: playerCount })}
                    </span>
                  </span>
                </button>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  );
}
