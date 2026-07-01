"use client";

import { useTranslations } from "next-intl";
import type { MasterpieceSubmission } from "../types";

const MEDALS = ["🥇", "🥈", "🥉"];

type Props = {
  rankings: { playerId: string; votes: number }[];
  submissions: MasterpieceSubmission[];
  players: { id: string; username: string }[];
  myId: string | null;
};

function DrawingPreview({ strokes }: { strokes: { points: { x: number; y: number }[]; color: string; size: number; opacity: number }[] }) {
  return (
    <svg viewBox="0 0 400 400" className="h-32 w-full rounded" style={{ backgroundColor: "#ffffff" }}>
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

export function ResultsPhase({ rankings, submissions, players, myId }: Props) {
  const t = useTranslations();

  const getUsername = (id: string) => players.find((p) => p.id === id)?.username ?? id;

  const getSubmission = (playerId: string) =>
    submissions.find((s) => s.playerId === playerId);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="text-center">
        <p className="text-sm font-medium text-white">{t("masterpiece.resultsTitle")}</p>
        <p className="mt-1 text-xs text-slate-400">{t("masterpiece.resultsSubtitle")}</p>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        {rankings.map((entry, idx) => {
          const sub = getSubmission(entry.playerId);
          return (
            <div
              key={entry.playerId}
              className={[
                "flex items-center gap-4 rounded-xl border p-3",
                entry.playerId === myId
                  ? "border-cyan-500/30 bg-cyan-500/5"
                  : "border-white/10 bg-white/[0.02]",
              ].join(" ")}
            >
              <span className="w-8 text-center text-lg">
                {idx < 3 ? MEDALS[idx] : `#${idx + 1}`}
              </span>

              {sub && <DrawingPreview strokes={sub.strokes} />}

              <div className="flex-1">
                <p className="text-sm font-medium text-white">{getUsername(entry.playerId)}</p>
                <p className="text-xs text-slate-400">
                  {t("masterpiece.voteCount", { count: entry.votes })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
