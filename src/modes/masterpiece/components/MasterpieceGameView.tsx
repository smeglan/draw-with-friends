"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { StrokeData } from "@/network/events";
import type { MasterpieceGameState } from "../types";
import { CreatingPhase } from "./CreatingPhase";
import { VotingPhase } from "./VotingPhase";
import { ResultsPhase } from "./ResultsPhase";
import { WaitingPhase } from "@/modes/telephone/components/WaitingPhase";

type Props = {
  masterpiece: MasterpieceGameState;
  players: { id: string; username: string }[];
  myId: string | null;
  onSubmitDrawing: (strokes: StrokeData[]) => void;
  onSubmitVote: (targetPlayerId: string) => void;
};

export function MasterpieceGameView({
  masterpiece,
  players,
  myId,
  onSubmitDrawing,
  onSubmitVote,
}: Props) {
  const t = useTranslations();
  const { phase, prompt, submissions, submittedPlayerIds, votedPlayerIds, votes, rankings, phaseEndsAt } = masterpiece;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (phaseEndsAt) {
      const interval = setInterval(() => setNow(Date.now()), 250);
      return () => clearInterval(interval);
    }
  }, [phaseEndsAt]);

  const submitted = myId ? submittedPlayerIds.includes(myId) : false;
  const votedFor = myId && votes ? votes[myId] ?? null : null;
  const timeLeftMs = phaseEndsAt ? Math.max(0, phaseEndsAt - now) : null;

  const handleDrawing = useCallback((strokes: StrokeData[]) => {
    onSubmitDrawing(strokes);
  }, [onSubmitDrawing]);

  const handleVote = useCallback((targetPlayerId: string) => {
    onSubmitVote(targetPlayerId);
  }, [onSubmitVote]);

  if (phase.type === "creating") {
    return <CreatingPhase prompt={prompt} onSubmit={handleDrawing} submitted={submitted} />;
  }

  if (phase.type === "voting") {
    return (
      <VotingPhase
        submissions={submissions}
        players={players}
        myId={myId}
        onVote={handleVote}
        votedFor={votedFor}
      />
    );
  }

  if (phase.type === "results") {
    return (
      <ResultsPhase
        rankings={rankings ?? []}
        submissions={submissions}
        players={players}
        myId={myId}
      />
    );
  }

  return (
    <WaitingPhase
      label={t("masterpiece.waitingTitle")}
      submittedCount={submittedPlayerIds.length}
      totalCount={players.length}
      timeLeftMs={timeLeftMs}
    />
  );
}
