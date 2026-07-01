import type { StrokeData, TelephoneChainLink } from "@/network/events";

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Circular right shift by 1: each player gets content from player at (i-1+n)%n */
export function circularAssign<T>(
  orderedPlayerIds: string[],
  items: Map<string, T>,
): Map<string, T> {
  const n = orderedPlayerIds.length;
  const result = new Map<string, T>();
  for (let i = 0; i < n; i++) {
    const giverIdx = (i - 1 + n) % n;
    const giverId = orderedPlayerIds[giverIdx];
    const item = items.get(giverId);
    if (item) result.set(orderedPlayerIds[i], item);
  }
  return result;
}

export function buildChain(
  orderedPlayerIds: string[],
  startIdx: number,
  phrase: string,
  roundSubmissions: Array<{
    drawings: Map<string, StrokeData[]>;
    descriptions: Map<string, string>;
  }>,
): TelephoneChainLink[] {
  const n = orderedPlayerIds.length;
  const chain: TelephoneChainLink[] = [
    { kind: "phrase", content: phrase, authorId: orderedPlayerIds[startIdx] },
  ];

  for (let r = 0; r < roundSubmissions.length; r++) {
    const drawerIdx = (startIdx + 1 + r * 2) % n;
    const drawerId = orderedPlayerIds[drawerIdx];
    const drawing = roundSubmissions[r].drawings.get(drawerId);
    if (drawing) {
      chain.push({ kind: "drawing", content: drawing, authorId: drawerId });
    }

    const descIdx = (startIdx + 2 + r * 2) % n;
    const descId = orderedPlayerIds[descIdx];
    const desc = roundSubmissions[r].descriptions.get(descId);
    if (desc) {
      chain.push({ kind: "description", content: desc, authorId: descId });
    }
  }

  return chain;
}

export function buildAllChains(
  orderedPlayerIds: string[],
  phrases: Map<string, string>,
  roundSubmissions: Array<{
    drawings: Map<string, StrokeData[]>;
    descriptions: Map<string, string>;
  }>,
): TelephoneChainLink[][] {
  return orderedPlayerIds.map((id, idx) =>
    buildChain(orderedPlayerIds, idx, phrases.get(id) ?? "", roundSubmissions),
  );
}

