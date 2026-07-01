"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";

type Props = {
  submittedCount: number;
  totalCount: number;
  label?: string;
  timeLeftMs?: number | null;
};

export function WaitingPhase({ submittedCount, totalCount, label, timeLeftMs }: Props) {
  const t = useTranslations();
  const remaining = totalCount - submittedCount;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
        <Icon name="phone" className="h-8 w-8 text-cyan-400" />
      </div>
      <h2 className="text-center text-lg font-medium text-white">
        {label ?? t("telephone.waitingTitle")}
      </h2>
      <p className="text-center text-sm text-slate-400">
        {remaining > 0
          ? t("telephone.waitingPlayers", { count: remaining })
          : t("telephone.waitingHost")}
      </p>
      {remaining > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          <span className="text-xs text-slate-500">
            {submittedCount}/{totalCount} {t("telephone.submitted")}
          </span>
        </div>
      )}
      {timeLeftMs !== undefined && timeLeftMs !== null && (
        <p className="text-xs text-cyan-300">
          {t("telephone.timeLeft", { time: formatCountdown(timeLeftMs) })}
        </p>
      )}
      {remaining === 0 && (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      )}
    </div>
  );
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
