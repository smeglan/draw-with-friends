"use client";

import { useTranslations } from "next-intl";
import { TelephoneDrawing } from "@/modes/telephone/components/TelephoneDrawing";
import type { StrokeData } from "@/network/events";

type Props = {
  prompt: string;
  onSubmit: (strokes: StrokeData[]) => void;
  submitted: boolean;
};

export function CreatingPhase({ prompt, onSubmit, submitted }: Props) {
  const t = useTranslations();

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-white/10 bg-cyan-500/10 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.08em] text-cyan-300">
          {t("masterpiece.creatingTitle")}
        </p>
        <p className="mt-1 text-sm font-medium text-white">{prompt}</p>
      </div>
      <TelephoneDrawing
        prompt={prompt}
        promptLabel={t("masterpiece.creatingTitle")}
        onSubmit={onSubmit}
        disabled={submitted}
      />
    </div>
  );
}
