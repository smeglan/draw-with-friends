"use client";

import Link from "next/link";
import { use } from "react";
import { Icon } from "@/shared/icons";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";
import { useState } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export default function RoomPage({ params }: Props) {
  const { id } = use(params);
  const { username, setUsername } = useUsername();
  const [dismissed, setDismissed] = useState(false);

  const showPrompt = !username && !dismissed;

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/lobby"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <Icon name="menu" className="h-3.5 w-3.5 rotate-90" />
            </Link>
            <h1 className="text-sm font-medium text-white">Sala: {id}</h1>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="text-xs text-slate-400">👤</span>
            <span className="text-xs text-slate-200">{username || "—"}</span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg text-slate-400">Sala lista</p>
            <p className="text-sm text-slate-500">
              El tablero de dibujo compartido se integrará
              <br />
              cuando el backend de salas esté listo.
            </p>
          </div>
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
