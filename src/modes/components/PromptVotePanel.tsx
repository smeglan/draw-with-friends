import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PromptProposal } from "../types";

type Props = {
  candidates: PromptProposal[];
  votes: Record<string, string>;
  myPlayerId: string;
  isHost: boolean;
  isVoting: boolean;
  onSubmitProposal: (text: string) => void;
  onStartVote: () => void;
  onVote: (proposalId: string) => void;
  onEndVote: () => void;
};

export function PromptVotePanel({
  candidates,
  votes,
  myPlayerId,
  isHost,
  isVoting,
  onSubmitProposal,
  onStartVote,
  onVote,
  onEndVote,
}: Props) {
  const t = useTranslations();
  const [draft, setDraft] = useState("");
  const myProposal = candidates.find((candidate) => candidate.playerId === myPlayerId);
  const myVote = votes[myPlayerId];

  const submit = () => {
    const text = draft.trim();
    if (!text || isVoting) return;
    onSubmitProposal(text);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-400">
          {isVoting ? t("masterpiece.promptVoteTitle") : t("masterpiece.promptProposalTitle")}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {isVoting ? t("masterpiece.promptVoteHint") : t("masterpiece.promptProposalHint")}
        </p>
      </div>

      {!isVoting && (
        <div className="flex gap-2">
          <input
            value={draft}
            maxLength={120}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("masterpiece.promptPlaceholder")}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={submit}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("masterpiece.submitProposal")}
          </button>
        </div>
      )}

      {myProposal && !isVoting && (
        <p className="text-xs text-slate-500">{t("masterpiece.proposalSubmitted")}</p>
      )}

      {candidates.length > 0 && (
        <div className="flex flex-col gap-2">
          {candidates.map((candidate) => {
            const voteCount = Object.values(votes).filter((proposalId) => proposalId === candidate.id).length;
            const isMyVote = myVote === candidate.id;
            return (
              <button
                key={candidate.id}
                type="button"
                disabled={!isVoting}
                onClick={() => onVote(candidate.id)}
                className={[
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                  isMyVote ? "border-cyan-500/50 bg-cyan-500/10" : "border-white/10 bg-white/5",
                  isVoting ? "hover:border-cyan-400/40" : "cursor-default",
                ].join(" ")}
              >
                <span className="min-w-0 flex-1 text-sm text-white">{candidate.text}</span>
                {isVoting && <span className="text-[11px] text-slate-500">{voteCount}</span>}
              </button>
            );
          })}
        </div>
      )}

      {isHost && !isVoting && (
        <button
          type="button"
          disabled={candidates.length === 0}
          onClick={onStartVote}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("masterpiece.startPromptVote")}
        </button>
      )}

      {isHost && isVoting && (
        <button
          type="button"
          disabled={Object.keys(votes).length === 0}
          onClick={onEndVote}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("masterpiece.endPromptVote")}
        </button>
      )}
    </div>
  );
}
