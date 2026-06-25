import { useTranslations } from "next-intl";
import { Icon } from "@/shared/icons";
import { getModeInfo } from "../registry";
import type { GameModeId } from "../types";

type Props = {
  candidates: GameModeId[];
  votes: Record<string, GameModeId>;
  myPlayerId: string;
  isHost: boolean;
  onVote: (mode: GameModeId) => void;
  onEndVote: () => void;
};

export function VotePanel({ candidates, votes, myPlayerId, isHost, onVote, onEndVote }: Props) {
  const t = useTranslations();
  const myVote = votes[myPlayerId];
  const totalVoters = Object.keys(votes).length;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-400">
        {t("modes.voteTitle")}
      </p>

      <div className="flex flex-col gap-1.5">
        {candidates.map((id) => {
          const info = getModeInfo(id);
          if (!info) return null;
          const voteCount = Object.values(votes).filter((v) => v === id).length;
          const isMyVote = myVote === id;

          return (
            <button
              key={id}
              type="button"
              disabled={!isHost && isMyVote}
              onClick={() => onVote(id)}
              className={[
                "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                isMyVote
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="mt-0.5 shrink-0 text-cyan-400">
                <Icon name={info.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{t(info.nameKey)}</p>
                <p className="mt-0.5 text-xs text-slate-400">{t(info.descriptionKey)}</p>
              </div>
              <div className="mt-0.5 shrink-0 text-right">
                {isMyVote && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-cyan-400">
                    <Icon name="check" />
                    {t("modes.voted")}
                  </span>
                )}
                <p className="text-[11px] text-slate-500">
                  {voteCount}/{totalVoters}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {isHost && (
        <button
          type="button"
          onClick={onEndVote}
          className="mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10"
        >
          {t("modes.endVote")}
        </button>
      )}
    </div>
  );
}
