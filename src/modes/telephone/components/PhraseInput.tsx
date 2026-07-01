"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  onSubmit: (phrase: string) => void;
  disabled?: boolean;
};

export function PhraseInput({ onSubmit, disabled }: Props) {
  const t = useTranslations();
  const [text, setText] = useState("");
  const maxChars = 80;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h2 className="text-center text-lg font-medium text-white">
        {t("telephone.phrasePrompt")}
      </h2>
      <p className="max-w-md text-center text-sm text-slate-400">
        {t("telephone.phraseHint")}
      </p>
      <div className="flex w-full max-w-md flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t("telephone.phrasePlaceholder")}
          disabled={disabled}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none disabled:opacity-40"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {text.length}/{maxChars}
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || text.trim().length === 0}
            className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {t("telephone.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
