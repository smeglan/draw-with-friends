"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { PasswordInput } from "@/landing/components/atoms/PasswordInput";

type Props = {
  onCreateRoom: (roomName?: string, password?: string) => void;
  onJoinRoom: (code: string, password?: string) => void;
  isLoading: boolean;
};

export function ActionCards({ onCreateRoom, onJoinRoom, isLoading }: Props) {
  const t = useTranslations();
  const [code, setCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [mode, setMode] = useState<"join" | "create">("join");
  const [roomName, setRoomName] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    onJoinRoom(trimmed, joinPassword || undefined);
  }

  function handleCreate() {
    onCreateRoom(roomName || undefined, createPassword || undefined);
  }

  function switchToCreate() {
    setCode("");
    setJoinPassword("");
    setMode("create");
  }

  function switchToJoin() {
    setRoomName("");
    setCreatePassword("");
    setMode("join");
  }

  return (
    <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_100px_-40px_rgba(15,23,42,0.8)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t("landing.actions.drawWithFriends")}</p>
          <p className="text-sm text-slate-400">
            {mode === "join" ? t("landing.actions.joinDescription") : t("landing.actions.createDescription")}
          </p>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: mode === "join" ? "500px" : "0px",
            opacity: mode === "join" ? 1 : 0,
            marginBottom: mode === "join" ? "0" : "0",
          }}
        >
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {t("landing.actions.roomCode")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="ABCD"
              maxLength={4}
              disabled={isLoading}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-center font-mono text-base tracking-[0.35em] text-white uppercase placeholder:text-slate-600 outline-none transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>

          {code.trim().length > 0 && (
            <div className="mt-2 space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">
                {t("landing.actions.password")}
              </label>
              <PasswordInput
                value={joinPassword}
                onChange={setJoinPassword}
                placeholder={t("landing.actions.passwordPlaceholder")}
                disabled={isLoading}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={code.trim().length === 0 || isLoading}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              t("landing.actions.join")
            )}
          </button>

          <div className="mt-4 flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{t("common.or")}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={switchToCreate}
            disabled={isLoading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="plus" className="h-4 w-4 text-cyan-400" />
            <span>{t("landing.actions.createRoom")}</span>
          </button>
        </div>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: mode === "create" ? "500px" : "0px",
            opacity: mode === "create" ? 1 : 0,
          }}
        >
          <button
            type="button"
            onClick={switchToJoin}
            disabled={isLoading}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-200"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            <span>{t("landing.actions.joinRoom")}</span>
          </button>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">
                {t("landing.actions.roomName")}
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder={t("landing.actions.roomNamePlaceholder")}
                disabled={isLoading}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.14em] text-slate-500">
                {t("landing.actions.password")}
              </label>
              <PasswordInput
                value={createPassword}
                onChange={setCreatePassword}
                placeholder={t("landing.actions.createRoomPasswordPlaceholder")}
                disabled={isLoading}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Icon name="plus" className="h-4 w-4" />
                    <span>{t("landing.actions.create")}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={switchToJoin}
                disabled={isLoading}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-400 transition hover:border-white/20 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
