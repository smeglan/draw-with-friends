"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { ErrorBanner } from "@/rooms/components/molecules/ErrorBanner";
import { PasswordInput } from "@/landing/components/atoms/PasswordInput";

type Props = {
  onCreateRoom: (roomName?: string, password?: string) => void;
  onJoinRoom: (code: string, password?: string) => void;
  error: string | null;
  isLoading: boolean;
};

export function LobbyActions({ onCreateRoom, onJoinRoom, error, isLoading }: Props) {
  const t = useTranslations();
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    onJoinRoom(code, joinPassword || undefined);
  }

  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onCreateRoom()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Icon name="plus" className="h-4 w-4" />
          )}
          {t("room.createRoom")}
        </button>

        <div className="flex flex-1 flex-col gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder={t("room.roomCodePlaceholder")}
            maxLength={4}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center font-mono text-lg tracking-widest text-white uppercase placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
          />

          {joinCode.trim().length > 0 && (
            <PasswordInput
              value={joinPassword}
              onChange={setJoinPassword}
              placeholder={t("room.passwordPlaceholder")}
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={joinCode.trim().length === 0 || isLoading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("room.join")}
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />
    </div>
  );
}
