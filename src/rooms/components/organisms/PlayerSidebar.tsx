"use client";

import { useState } from "react";
import type { Player } from "@/network/events";
import { ConnectionDot } from "@/rooms/components/atoms/ConnectionDot";
import { PlayerList } from "@/rooms/components/molecules/PlayerList";

type Props = {
  players: Player[];
  hostId: string | null;
  isConnected: boolean;
  isJoined: boolean;
  error: string | null;
  peerStatus: string;
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
  const playerCount = players.length;
  const canPlay = playerCount >= 2;
  const [ready, setReady] = useState(false);

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 border-r border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <ConnectionDot connected={isConnected} />
        <span className="text-xs text-slate-400">Sala:</span>
        <span className="font-mono text-sm font-medium text-white">{roomId}</span>
      </div>

      {!isConnected && (
        <div className="rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-400">
          Desconectado — esperando reconexión...
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
          Uniéndose a la sala...
        </div>
      )}

      {isJoined && (
        <>
          <div>
            <p className="mb-1 text-sm text-slate-300">
              {canPlay ? "¡Listo para jugar!" : "Esperando jugadores..."}
            </p>
            <p className="text-xs text-slate-500">
              {playerCount} jugador{playerCount !== 1 ? "es" : ""} conectado{playerCount !== 1 ? "s" : ""}
              {!canPlay && " (mínimo 2)"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
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

          <button
            type="button"
            onClick={() => setReady((r) => !r)}
            className={[
              "mt-auto rounded-xl px-6 py-3 font-medium transition",
              ready
                ? "bg-green-500 text-white hover:bg-green-400"
                : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10",
            ].join(" ")}
          >
            {ready ? "✓ Listo" : "Listo"}
          </button>
        </>
      )}
    </aside>
  );
}
