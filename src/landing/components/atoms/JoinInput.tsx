"use client";

import { useState } from "react";
import { Icon } from "@/shared/icons";
import { PasswordInput } from "@/landing/components/atoms/PasswordInput";

type Props = {
  onJoin: (code: string, password?: string) => void;
  disabled?: boolean;
};

export function JoinInput({ onJoin, disabled }: Props) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    onJoin(trimmed, password || undefined);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Código"
          maxLength={4}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-white uppercase placeholder-slate-500 outline-none transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={code.trim().length === 0 || disabled}
          className="flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="import" className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">Unirse</span>
        </button>
      </div>
      {code.trim().length > 0 && (
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Contraseña (opcional)"
          disabled={disabled}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      )}
    </div>
  );
}
