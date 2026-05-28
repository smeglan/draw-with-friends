"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/shared/icons";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";

type Room = {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  mode: string;
};

const FEATURED_ROOMS: Room[] = [
  { id: "abc123", name: "Sala de prueba", players: 2, maxPlayers: 4, mode: "Obra maestra" },
  { id: "def456", name: "Dibujo libre", players: 1, maxPlayers: 4, mode: "Teléfono roto" },
  { id: "ghi789", name: "Partida rápida", players: 4, maxPlayers: 4, mode: "Fusión" },
];

export function LandingHero() {
  const router = useRouter();
  const { username, setUsername } = useUsername();
  const [joinCode, setJoinCode] = useState("");
  const [showEditName, setShowEditName] = useState(false);

  const handleJoin = () => {
    const code = joinCode.trim();
    if (code.length === 0) return;
    router.push(`/room/${code}`);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-16 text-center">
        <h1 className="mb-1 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Los Pibes Que Dibujan
        </h1>
        <p className="mb-6 text-xs text-slate-500">
          (nombre provisional)
        </p>

        {username && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="text-sm text-slate-400">👤</span>
            <span className="text-sm text-slate-200">{username}</span>
            <button
              type="button"
              onClick={() => setShowEditName(true)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:text-white"
              aria-label="Cambiar nombre"
              title="Cambiar nombre"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
          </div>
        )}

        <div className="mb-8 flex w-full max-w-sm gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Código de sala"
            maxLength={6}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joinCode.trim().length === 0}
            className="rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Unirse
          </button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/draw"
            className="flex items-center gap-3 rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-medium text-white shadow-lg transition hover:bg-cyan-400 active:scale-[0.97]"
          >
            <Icon name="brush" className="h-5 w-5" />
            Dibujo Libre
          </Link>

          <Link
            href="/lobby"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-medium text-slate-200 shadow-lg transition hover:bg-white/10 active:scale-[0.97]"
          >
            <Icon name="layers" className="h-5 w-5" />
            Salas
          </Link>
        </div>
      </div>

      <section className="px-4 pb-12">
        <p className="mb-4 text-center text-sm text-slate-500">
          O entrá a una sala destacada
        </p>
        <div className="mx-auto grid max-w-lg gap-3 sm:grid-cols-3">
          {FEATURED_ROOMS.map((room) => (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              className="group rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-cyan-400/30 hover:bg-white/10"
            >
              <p className="truncate text-sm font-medium text-white">{room.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{room.mode}</p>
              <p className="mt-1 text-xs text-slate-500">
                {room.players}/{room.maxPlayers}
              </p>
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  room.players < room.maxPlayers
                    ? "bg-green-500/15 text-green-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {room.players < room.maxPlayers ? "Esperando" : "Jugando"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 px-4 py-4 text-center">
        <p className="text-xs text-slate-600">
          Hecho con <span className="text-red-400">💙</span> por Los Pibes Que Dibujan
        </p>
      </footer>

      {showEditName && (
        <NamePrompt
          defaultValue={username}
          onSubmit={(name) => {
            setUsername(name);
            setShowEditName(false);
          }}
        />
      )}
    </div>
  );
}
