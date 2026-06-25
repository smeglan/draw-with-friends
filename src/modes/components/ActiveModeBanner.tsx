import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { getModeInfo } from "../registry";
import type { GameModeId } from "../types";

type Props = {
  mode: GameModeId;
  isHost: boolean;
  onChangeMode: () => void;
};

export function ActiveModeBanner({ mode, isHost, onChangeMode }: Props) {
  const t = useTranslations();
  const info = getModeInfo(mode);
  if (!info) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-400">
        {t("modes.heading")}
      </p>
      <div className="flex items-start gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-3 py-2.5">
        <div className="mt-0.5 shrink-0 text-cyan-400">
          <Icon name={info.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{t(info.nameKey)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{t(info.descriptionKey)}</p>
        </div>
      </div>
      {isHost && (
        <button
          type="button"
          onClick={onChangeMode}
          className="self-start rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
        >
          {t("modes.changeMode")}
        </button>
      )}
    </div>
  );
}
