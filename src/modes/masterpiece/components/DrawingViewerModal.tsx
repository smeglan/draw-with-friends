"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { MasterpieceSubmission } from "../types";

type Props = {
  submission: MasterpieceSubmission;
  authorName: string;
  canVote: boolean;
  isVoted: boolean;
  onClose: () => void;
  onConfirmVote: () => void;
};

function buildSvg(strokes: MasterpieceSubmission["strokes"]) {
  const paths = strokes
    .filter((stroke) => stroke.points.length >= 2)
    .map((stroke) => {
      const d = stroke.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
      return `<path d="${d}" fill="none" stroke="${stroke.color}" stroke-width="${stroke.size}" stroke-linecap="round" stroke-linejoin="round" opacity="${stroke.opacity}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="1200" height="1200"><rect width="400" height="400" fill="white"/>${paths}</svg>`;
}

function DrawingCanvas({ strokes }: { strokes: MasterpieceSubmission["strokes"] }) {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" style={{ backgroundColor: "#ffffff" }}>
      {strokes.map((stroke, strokeIndex) => {
        if (stroke.points.length < 2) return null;
        const d = stroke.points.map((point, pointIndex) => `${pointIndex === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
        return <path key={strokeIndex} d={d} fill="none" stroke={stroke.color} strokeWidth={stroke.size} strokeLinecap="round" strokeLinejoin="round" opacity={stroke.opacity} />;
      })}
    </svg>
  );
}

export function DrawingViewerModal({ submission, authorName, canVote, isVoted, onClose, onConfirmVote }: Props) {
  const t = useTranslations();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([buildSvg(submission.strokes)], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `obra-maestra-${authorName.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "dibujo"}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("masterpiece.viewerTitle")} onClick={onClose}>
      <div className="flex max-h-[95dvh] w-full max-w-3xl flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-slate-400">{t("masterpiece.viewerTitle")}</p>
            <p className="mt-1 text-base font-medium text-white">{authorName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-white/10 hover:text-white" aria-label={t("masterpiece.closeViewer")}>×</button>
        </div>
        <div className="mx-auto aspect-square w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-inner">
          <DrawingCanvas strokes={submission.strokes} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={download} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10">{t("masterpiece.downloadDrawing")}</button>
          {canVote && !isVoted && <button type="button" onClick={onConfirmVote} className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-400">{t("masterpiece.confirmVote")}</button>}
          {isVoted && <p className="self-center text-sm text-green-400">{t("masterpiece.votedLabel")}</p>}
        </div>
      </div>
    </div>
  );
}
