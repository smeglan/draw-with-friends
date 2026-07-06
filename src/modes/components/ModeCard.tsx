import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import type { GameModeInfo } from "../types";

type Props = {
  mode: GameModeInfo;
  selected?: boolean;
  playerCount: number;
  actionLabel: string;
  onAction: (id: GameModeInfo["id"]) => void;
};

export function ModeCard({ mode, selected, playerCount, actionLabel, onAction }: Props) {
  const t = useTranslations();
  const needsMorePlayers = playerCount < mode.minPlayers;

  return (
    <button
      type="button"
      onClick={() => onAction(mode.id)}
      className={[
        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition",
        selected
          ? "border-cyan-500/50 bg-cyan-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
      ].join(" ")}
    >
      <div className="mt-0.5 shrink-0 text-cyan-400">
        <Icon name={mode.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{t(mode.nameKey)}</p>
        <p className="mt-0.5 text-xs text-slate-400">{t(mode.descriptionKey)}</p>
        {needsMorePlayers && (
          <span className="mt-1 inline-block rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
            {t("modes.needsPlayers", { count: mode.minPlayers })}
          </span>
        )}
      </div>
      {selected && (
        <span className="mt-0.5 shrink-0 text-cyan-400">
          <Icon name="check" />
        </span>
      )}
      {!selected && (
        <span className={`mt-0.5 shrink-0 text-[11px] font-medium ${needsMorePlayers ? "text-slate-500" : "text-cyan-400"}`}>
          {actionLabel}
        </span>
      )}
    </button>
  );
}
