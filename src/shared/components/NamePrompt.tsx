"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type NamePromptProps = {
  onSubmit: (name: string) => void;
  defaultValue?: string;
};

export function NamePrompt({ onSubmit, defaultValue = "" }: NamePromptProps) {
  const t = useTranslations();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
        <h2 className="mb-1 text-center text-lg font-semibold text-white">
          {t("namePrompt.title")}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-400">
          {t("namePrompt.description")}
        </p>

        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={t("namePrompt.placeholder")}
          maxLength={20}
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={value.trim().length === 0}
          className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("namePrompt.confirm")}
        </button>
      </div>
    </div>
  );
}
