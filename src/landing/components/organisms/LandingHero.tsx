"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeroTitle } from "@/landing/components/atoms/HeroTitle";
import { UsernameBadge } from "@/landing/components/atoms/UsernameBadge";
import { ActionCards } from "@/landing/components/molecules/ActionCards";
import { Icon } from "@/shared/icons";
import { useLanding } from "@/landing/hooks/useLanding";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";

export function LandingHero() {
  const { username, setUsername } = useUsername();
  const { createRoom, joinRoom, error, isLoading } = useLanding();
  const router = useRouter();
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.85),rgba(2,6,23,1))]" />

      <div className="relative flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8">
        <HeroTitle />

        {username && (
          <UsernameBadge
            username={username}
            onEdit={() => setShowNamePrompt(true)}
          />
        )}

        {error && (
          <div className="w-full max-w-sm rounded-xl bg-red-400/10 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <ActionCards
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          isLoading={isLoading}
        />
      </div>

      <div className="relative mt-4 w-full max-w-xl">
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">o</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={() => router.push("/draw")}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          <Icon name="brush" className="h-4 w-4 text-cyan-400" />
          <span>Dibujo libre</span>
        </button>
      </div>

      <footer className="relative mt-8 max-w-md text-center">
        <p className="text-xs leading-relaxed text-slate-600">
          Creado por un deseempleado, tirame una moneda antes de que me lleve el proyecto conmigo a la tumba.
        </p>
      </footer>

      {(!username || showNamePrompt) && (
        <NamePrompt
          defaultValue={username}
          onSubmit={(name) => {
            setUsername(name);
            setShowNamePrompt(false);
          }}
        />
      )}
    </div>
  );
}
