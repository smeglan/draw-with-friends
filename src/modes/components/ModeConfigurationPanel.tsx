import { useTranslations } from "next-intl";
import type { GameModeId } from "../types";

type Props = {
  mode: GameModeId | null;
  isHost: boolean;
  masterpiecePrompt: string;
  telephoneRounds: number;
  onMasterpiecePromptChange: (value: string) => void;
  onTelephoneRoundsChange: (value: number) => void;
};

export function ModeConfigurationPanel({
  mode,
  isHost,
  masterpiecePrompt,
  telephoneRounds,
  onMasterpiecePromptChange,
  onTelephoneRoundsChange,
}: Props) {
  const t = useTranslations();

  if (!mode) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center text-sm text-slate-500">
        {t("modes.configuration.chooseMode")}
      </div>
    );
  }

  return (
    <div className="flex min-h-52 flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-400">
          {t("modes.configuration.title")}
        </p>
        <p className="mt-1 text-sm text-white">{t(`modes.${mode}.name`)}</p>
      </div>

      {mode === "masterpiece" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="masterpiece-prompt" className="text-xs font-medium text-slate-300">
            {t("modes.configuration.masterpiecePrompt")}
          </label>
          <input
            id="masterpiece-prompt"
            type="text"
            value={masterpiecePrompt}
            maxLength={120}
            disabled={!isHost}
            onChange={(event) => onMasterpiecePromptChange(event.target.value)}
            placeholder={t("masterpiece.promptPlaceholder")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="text-[11px] text-slate-500">
            {isHost ? t("masterpiece.promptHint") : t("masterpiece.waitingPrompt")}
          </p>
        </div>
      )}

      {mode === "telephone" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="telephone-rounds" className="text-xs font-medium text-slate-300">
            {t("telephone.setRounds")}
          </label>
          <input
            id="telephone-rounds"
            type="number"
            min={1}
            max={10}
            value={telephoneRounds}
            disabled={!isHost}
            onChange={(event) => onTelephoneRoundsChange(Number(event.target.value))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      )}

      {(mode === "fusion" || mode === "pictionary") && (
        <p className="text-sm leading-6 text-slate-400">
          {t("modes.configuration.noOptions")}
        </p>
      )}
    </div>
  );
}
