"use client";

import Link from "next/link";
import { Icon } from "@/shared/icons";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";
import { useState } from "react";

type Room = {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  mode: string;
};

const MOCK_ROOMS: Room[] = [
  { id: "abc123", name: "Sala de prueba", players: 2, maxPlayers: 4, mode: "Obra maestra" },
  { id: "def456", name: "Dibujo libre", players: 1, maxPlayers: 4, mode: "Teléfono roto" },
  { id: "ghi789", name: "Partida rápida", players: 4, maxPlayers: 4, mode: "Fusión" },
];

export default function LobbyPage() {
  const { username, setUsername } = useUsername();
  const [dismissed, setDismissed] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const showPrompt = !username && !dismissed;

  return (
    <>
      <div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <Icon name="menu" className="h-4 w-4 rotate-90" />
            </Link>
            <h1 className="text-xl font-bold text-white">Salas</h1>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="text-sm text-slate-400">👤</span>
            <span className="text-sm text-slate-200">{username || "Sin nombre"}</span>
          </div>
        </div>

        <div className="mb-8 flex gap-3">
          <button
            type="button"
            onClick={() => alert("Crear sala — próximo")}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-white transition hover:bg-cyan-400"
          >
            <Icon name="plus" className="h-4 w-4" />
            Crear Sala
          </button>

          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Código de sala"
              maxLength={6}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
            />
            <button
              type="button"
              onClick={() => alert(`Unirse a sala ${joinCode} — próximo`)}
              disabled={joinCode.trim().length === 0}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Unirse
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_ROOMS.map((room) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/30 hover:bg-white/10"
            >
              <h3 className="mb-1 font-medium text-white">{room.name}</h3>
              <p className="mb-2 text-xs text-slate-500">{room.mode}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {room.players}/{room.maxPlayers} jugadores
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    room.players < room.maxPlayers
                      ? "bg-green-500/15 text-green-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {room.players < room.maxPlayers ? "Esperando" : "Jugando"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

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
