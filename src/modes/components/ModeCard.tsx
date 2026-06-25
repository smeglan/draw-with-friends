import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import type { GameModeInfo } from "../types";

type Props = {
  mode: GameModeInfo;
  selected?: boolean;
  disabled?: boolean;
  actionLabel: string;
  onAction: (id: GameModeInfo["id"]) => void;
};

export function ModeCard({ mode, selected, disabled, actionLabel, onAction }: Props) {
  const t = useTranslations();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAction(mode.id)}
      className={[
        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition",
        selected
          ? "border-cyan-500/50 bg-cyan-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
        disabled && "cursor-not-allowed opacity-40",
      ].join(" ")}
    >
      <div className="mt-0.5 shrink-0 text-cyan-400">
        <Icon name={mode.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{t(mode.nameKey)}</p>
        <p className="mt-0.5 text-xs text-slate-400">{t(mode.descriptionKey)}</p>
      </div>
      {selected && (
        <span className="mt-0.5 shrink-0 text-cyan-400">
          <Icon name="check" />
        </span>
      )}
      {!selected && (
        <span className="mt-0.5 shrink-0 text-[11px] font-medium text-cyan-400">
          {actionLabel}
        </span>
      )}
    </button>
  );
}
