"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MasterpieceSubmission } from "../types";
import { DrawingViewerModal } from "./DrawingViewerModal";

type Props = {
  submissions: MasterpieceSubmission[];
  players: { id: string; username: string }[];
  myId: string | null;
  onVote: (targetPlayerId: string) => void;
  votedFor: string | null;
};

function DrawingPreview({ strokes }: { strokes: { points: { x: number; y: number }[]; color: string; size: number; opacity: number }[] }) {
  return (
    <svg viewBox="0 0 400 400" className="h-48 w-full rounded" style={{ backgroundColor: "#ffffff" }}>
      {strokes.map((stroke, si) => {
        if (stroke.points.length < 2) return null;
        const d = stroke.points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
        return (
          <path
            key={si}
            d={d}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.size}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={stroke.opacity}
          />
        );
      })}
    </svg>
  );
}

export function VotingPhase({ submissions, players, myId, onVote, votedFor }: Props) {
  const t = useTranslations();
  const [selectedSubmission, setSelectedSubmission] = useState<MasterpieceSubmission | null>(null);

  const getUsername = (id: string) => players.find((p) => p.id === id)?.username ?? id;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="text-center">
        <p className="text-sm font-medium text-white">{t("masterpiece.votingTitle")}</p>
        <p className="mt-1 text-xs text-slate-400">{t("masterpiece.votingHint")}</p>
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map((sub) => {
          const isMySubmission = sub.playerId === myId;
          const isVoted = votedFor === sub.playerId;
          return (
            <button
              key={sub.playerId}
              type="button"
              onClick={() => setSelectedSubmission(sub)}
              className={[
                "flex flex-col overflow-hidden rounded-xl border bg-white/5 p-2 text-left transition",
                isVoted
                  ? "border-green-400/50 ring-1 ring-green-400/30"
                  : isMySubmission
                    ? "border-white/5 opacity-50"
                    : "border-white/10 hover:border-white/20 hover:bg-white/10",
                "cursor-pointer",
              ].join(" ")}
            >
              <DrawingPreview strokes={sub.strokes} />
              <div className="mt-2 flex items-center gap-2 px-1">
                <span className="text-xs text-slate-300">{getUsername(sub.playerId)}</span>
                {isMySubmission && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {t("common.you") ?? "You"}
                  </span>
                )}
                {isVoted && (
                  <span className="ml-auto text-[11px] text-green-400">{t("masterpiece.votedLabel")}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {votedFor && (
        <p className="text-center text-sm text-slate-300">
          {t("masterpiece.votedFor", { name: getUsername(votedFor) })}
        </p>
      )}

      {selectedSubmission && (
        <DrawingViewerModal
          submission={selectedSubmission}
          authorName={getUsername(selectedSubmission.playerId)}
          canVote={selectedSubmission.playerId !== myId && votedFor === null}
          isVoted={votedFor === selectedSubmission.playerId}
          onClose={() => setSelectedSubmission(null)}
          onConfirmVote={() => {
            onVote(selectedSubmission.playerId);
            setSelectedSubmission(null);
          }}
        />
      )}
    </div>
  );
}
