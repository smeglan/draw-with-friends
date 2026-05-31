"use client";

import Link from "next/link";
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
  const playerCount = players.length;
  const canPlay = playerCount >= 2;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <ErrorBanner message={error} />

      {!isConnected && (
        <div className="text-center">
          <p className="mb-2 text-lg text-slate-400">Desconectado</p>
          <p className="text-sm text-slate-500">Esperando reconexión...</p>
          <div className="mx-auto mt-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-400" />
        </div>
      )}

      {isConnected && !isJoined && !error && (
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-400" />
          <p className="text-sm text-slate-400">Uniéndose a la sala...</p>
        </div>
      )}

      {isJoined && (
        <>
          <div className="text-center">
            <p className="mb-1 text-lg text-slate-300">
              {canPlay ? "¡Listo para jugar!" : "Esperando jugadores..."}
            </p>
            <p className="text-sm text-slate-500">
              {playerCount} jugador{playerCount !== 1 ? "es" : ""} conectado
              {playerCount !== 1 ? "s" : ""}
              {!canPlay && " (mínimo 2)"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {peerStatus === "idle" && "Esperando conexión P2P..."}
              {peerStatus === "connecting" && "Estableciendo conexión P2P..."}
              {peerStatus === "connected" && (
                <span className="text-green-400">Conexión P2P establecida</span>
              )}
              {peerStatus === "disconnected" && (
                <span className="text-red-400">Conexión P2P perdida</span>
              )}
              {peerStatus === "error" && (
                <span className="text-red-400">Error en conexión P2P</span>
              )}
            </p>
          </div>

          <PlayerList players={players} hostId={hostId} />

          {canPlay && (
            <Link
              href={`/draw?room=${roomId}`}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-white transition hover:bg-cyan-400"
            >
              Ir al tablero
            </Link>
          )}
        </>
      )}
    </div>
  );
}
