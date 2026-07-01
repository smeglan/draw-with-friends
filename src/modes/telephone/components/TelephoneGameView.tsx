"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TelephoneGameState } from "../types";
import type { StrokeData } from "@/network/events";
import { PhraseInput } from "./PhraseInput";
import { TelephoneDrawing } from "./TelephoneDrawing";
import { DescriptionInput } from "./DescriptionInput";
import { WaitingPhase } from "./WaitingPhase";
import { ChainReveal } from "./ChainReveal";
import { Icon, type IconName } from "@/shared/icons";

type Props = {
  telephone: TelephoneGameState;
  players: { id: string; username: string }[];
  myId: string | null;
  onSubmitPhrase: (phrase: string) => void;
  onSubmitDrawing: (strokes: StrokeData[]) => void;
  onSubmitDescription: (text: string) => void;
};

export function TelephoneGameView({
  telephone,
  players,
  myId,
  onSubmitPhrase,
  onSubmitDrawing,
  onSubmitDescription,
}: Props) {
  const t = useTranslations();
  const { phase, assignedPrompt, submittedPlayerIds, currentRound, totalRounds } = telephone;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!telephone.phaseEndsAt) return;

    setNow(Date.now());
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, [telephone.phaseEndsAt, phase.type]);

  const timeLeftMs = telephone.phaseEndsAt ? Math.max(0, telephone.phaseEndsAt - now) : null;

  const handlePhrase = useCallback(
    (phrase: string) => {
      onSubmitPhrase(phrase);
    },
    [onSubmitPhrase],
  );

  const handleDrawing = useCallback(
    (strokes: StrokeData[]) => {
      onSubmitDrawing(strokes);
    },
    [onSubmitDrawing],
  );

  const handleDescription = useCallback(
    (text: string) => {
      onSubmitDescription(text);
    },
    [onSubmitDescription],
  );

  const submitted = submittedPlayerIds.length;

  if (phase.type === "writing_phrase") {
    return (
      <div className="flex flex-1 flex-col">
        <PhaseHeader round={currentRound} totalRounds={totalRounds} phase="phrase" timeLeftMs={timeLeftMs} />
        <PhraseInput onSubmit={handlePhrase} />
      </div>
    );
  }

  if (phase.type === "drawing" && assignedPrompt) {
    const prompt = assignedPrompt.content as string;
    const label =
      assignedPrompt.kind === "phrase"
        ? t("telephone.drawingPhrasePrompt")
        : t("telephone.drawingDescPrompt");
    return (
      <div className="flex flex-1 flex-col">
        <PhaseHeader round={currentRound} totalRounds={totalRounds} phase="drawing" timeLeftMs={timeLeftMs} />
        <TelephoneDrawing
          prompt={prompt}
          promptLabel={label}
          onSubmit={handleDrawing}
        />
      </div>
    );
  }

  if (phase.type === "describing" && assignedPrompt && assignedPrompt.kind === "drawing") {
    return (
      <div className="flex flex-1 flex-col">
        <PhaseHeader round={currentRound} totalRounds={totalRounds} phase="describing" timeLeftMs={timeLeftMs} />
        <AssignedDrawingView strokes={assignedPrompt.content} />
        <DescriptionInput onSubmit={handleDescription} />
      </div>
    );
  }

  if (phase.type === "reveal" && telephone.chains) {
    return (
      <ChainReveal chains={telephone.chains} players={players} myId={myId} />
    );
  }

  return (
    <WaitingPhase
      submittedCount={submitted}
      totalCount={players.length}
      timeLeftMs={timeLeftMs}
    />
  );
}

function PhaseHeader({
  round,
  totalRounds,
  phase,
  timeLeftMs,
}: {
  round: number;
  totalRounds: number;
  phase: string;
  timeLeftMs: number | null;
}) {
  const t = useTranslations();
  const iconMap: Record<string, IconName> = { phrase: "helpCircle", drawing: "brush", describing: "phone" };
  const icon = iconMap[phase] ?? "phone";
  const label =
    phase === "phrase"
      ? t("telephone.phasePhrase")
      : phase === "drawing"
        ? t("telephone.phaseDrawing")
        : t("telephone.phaseDescribing");

  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
      <Icon name={icon as any} className="h-4 w-4 text-cyan-400" />
      <span className="text-sm font-medium text-white">{label}</span>
      <span className="ml-auto text-xs text-slate-500">
        {t("telephone.roundIndicator", { round, total: totalRounds })}
      </span>
      {timeLeftMs !== null && (
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-200">
          {t("telephone.timeLeft", { time: formatCountdown(timeLeftMs) })}
        </span>
      )}
    </div>
  );
}

function AssignedDrawingView({
  strokes,
}: {
  strokes: StrokeData[];
}) {
  if (strokes.length === 0) return null;

  return (
    <div className="border-b border-white/10 bg-white/[0.02] p-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-slate-400">
        Drawing to describe
      </p>
      <div className="mx-auto max-w-xs overflow-hidden rounded-xl border border-white/10 bg-white p-2">
        <svg
          viewBox="0 0 400 400"
          className="h-48 w-full rounded"
          style={{ backgroundColor: "#ffffff" }}
        >
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
      </div>
    </div>
  );
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
