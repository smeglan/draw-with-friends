"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Player } from "@/network/events";
import type { PeerStatus } from "@/network/client/PeerManager";
import { ConnectionDot } from "@/rooms/components/atoms/ConnectionDot";
import { PlayerList } from "@/rooms/components/molecules/PlayerList";

type Props = {
  players: Player[];
  hostId: string | null;
  isConnected: boolean;
  isJoined: boolean;
  error: string | null;
  peerStatus: PeerStatus;
  roomId: string;
};

export function PlayerSidebar({
  players,
  hostId,
  isConnected,
  isJoined,
  error,
  peerStatus,
  roomId,
}: Props) {
  const t = useTranslations();
  const playerCount = players.length;
  const canPlay = playerCount >= 2;
  const [ready, setReady] = useState(false);
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

          <PlayerList players={players} hostId={hostId} />

          <button
            type="button"
            onClick={() => setReady((r) => !r)}
            className={[
              "mt-auto rounded-xl px-6 py-3 font-medium transition lg:sticky lg:bottom-4",
              ready
                ? "bg-green-500 text-white hover:bg-green-400"
                : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10",
            ].join(" ")}
          >
            {ready ? t("room.sidebar.readyCheck") : t("room.sidebar.ready")}
          </button>
        </>
      )}
    </aside>
  );
}
