"use client";

import Link from "next/link";
import { Icon } from "@/shared/icons";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";
import { useLobby } from "@/rooms/hooks/useLobby";
import { LobbyActions } from "@/rooms/components/organisms/LobbyActions";
import { useState } from "react";

export function LobbyTemplate() {
  const { username, setUsername } = useUsername();
  const { createRoom, joinRoom, error, isLoading } = useLobby();
  const [dismissed, setDismissed] = useState(false);

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

        <LobbyActions
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
          isLoading={isLoading}
        />
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
