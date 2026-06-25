import { useTranslations } from "next-intl";
import { MODES } from "../registry";
import type { GameModeId } from "../types";
import { ModeCard } from "./ModeCard";

type Props = {
  playerCount: number;
  onSelect: (mode: GameModeId) => void;
  onStartVote: () => void;
};

export function ModeSelector({ playerCount, onSelect, onStartVote }: Props) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-400">
        {t("modes.hostPicking")}
      </p>
      <div className="flex flex-col gap-1.5">
        {MODES.map((mode) => (
          <ModeCard
            key={mode.id}
            mode={mode}
            disabled={playerCount < mode.minPlayers}
            actionLabel={t("modes.select")}
            onAction={onSelect}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onStartVote}
        className="mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10"
      >
        {t("modes.startVote")}
      </button>
    </div>
  );
}
