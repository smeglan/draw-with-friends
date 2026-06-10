"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Player } from "@/network/events";
import { PlayerList } from "@/rooms/components/molecules/PlayerList";
import { ErrorBanner } from "@/rooms/components/molecules/ErrorBanner";

type Props = {
  players: Player[];
  hostId: string | null;
  isJoined: boolean;
  error: string | null;
  isConnected: boolean;
  peerStatus: string;
  roomId: string;
};

export function RoomStatus({ players, hostId, isJoined, error, isConnected, peerStatus, roomId }: Props) {
  const t = useTranslations();
  const playerCount = players.length;
  const canPlay = playerCount >= 2;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <ErrorBanner message={error} />

      {!isConnected && (
        <div className="text-center">
          <p className="mb-2 text-lg text-slate-400">{t("room.disconnected")}</p>
          <p className="text-sm text-slate-500">{t("room.reconnecting")}</p>
          <div className="mx-auto mt-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-400" />
        </div>
      )}

      {isConnected && !isJoined && !error && (
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-400" />
          <p className="text-sm text-slate-400">{t("room.joining")}</p>
        </div>
      )}

      {isJoined && (
        <>
          <div className="text-center">
            <p className="mb-1 text-lg text-slate-300">
              {canPlay ? t("room.readyToPlay") : t("room.waitingPlayers")}
            </p>
            <p className="text-sm text-slate-500">
              {t("room.playerCount", { count: playerCount })}
              {!canPlay && t("room.minPlayers")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {peerStatus === "idle" && t("room.waitingP2P")}
              {peerStatus === "connecting" && t("room.connectingP2P")}
              {peerStatus === "connected" && (
                <span className="text-green-400">{t("room.p2pEstablished")}</span>
              )}
              {peerStatus === "disconnected" && (
                <span className="text-red-400">{t("room.p2pLost")}</span>
              )}
              {peerStatus === "error" && (
                <span className="text-red-400">{t("room.p2pError")}</span>
              )}
            </p>
          </div>

          <PlayerList players={players} hostId={hostId} />

          {canPlay && (
            <Link
              href={`/draw?room=${roomId}`}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-white transition hover:bg-cyan-400"
            >
              {t("room.goToBoard")}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
