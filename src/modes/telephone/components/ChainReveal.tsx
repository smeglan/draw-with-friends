"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { TelephoneChainLink } from "@/network/events";
import { Icon } from "@/shared/icons";

type Props = {
  chains: TelephoneChainLink[][];
  players: { id: string; username: string }[];
  myId: string | null;
};

function getUsername(playerId: string, players: { id: string; username: string }[]): string {
  return players.find((p) => p.id === playerId)?.username ?? playerId.slice(0, 6);
}

function ChainCard({ chain, players, index }: { chain: TelephoneChainLink[]; players: { id: string; username: string }[]; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  if (chain.length === 0) return null;
  const first = chain[0];
  if (first.kind !== "phrase") return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
      >
        <Icon name="phone" className="h-4 w-4 shrink-0 text-cyan-400" />
        <span className="text-sm font-medium text-white">
          &ldquo;{first.content}&rdquo;
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          {getUsername(first.authorId, players)}
        </span>
        <Icon
          name="arrowLeft"
          className={`h-3 w-3 shrink-0 text-slate-500 transition ${expanded ? "-rotate-90" : "rotate-0"}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex flex-col gap-3">
            {chain.map((link, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex shrink-0 flex-col items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium ${
                      link.kind === "phrase"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : link.kind === "drawing"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {link.kind === "phrase" ? "P" : link.kind === "drawing" ? "D" : "T"}
                  </div>
                  {i < chain.length - 1 && (
                    <div className="mt-0.5 h-full w-px bg-white/10" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.06em]">
                      {link.kind === "phrase"
                        ? "Frase"
                        : link.kind === "drawing"
                          ? "Dibujo"
                          : "Texto"}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      — {getUsername(link.authorId, players)}
                    </span>
                  </div>
                  <div className="mt-1">
                    {link.kind === "drawing" ? (
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-white p-1">
                        <DrawingPreview strokes={link.content} />
                      </div>
                    ) : (
                      <p className="text-sm italic text-slate-300">
                        &ldquo;{link.content}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DrawingPreview({ strokes }: { strokes: { points: { x: number; y: number }[]; color: string; size: number; opacity: number }[] }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="h-32 w-full rounded"
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
  );
}

export function ChainReveal({ chains, players, myId }: Props) {
  const t = useTranslations();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-white">
            {t("telephone.revealTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {t("telephone.revealSubtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {chains.map((chain, i) => (
            <ChainCard key={i} chain={chain} players={players} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
