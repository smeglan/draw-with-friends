import type { TelephoneGameState } from "./types";

export type PhaseType = "phrase" | "drawing" | "describing";

export interface PhaseDefinition {
  type: PhaseType;
  timeoutMs: number;
  stateType: TelephoneGameState["phase"]["type"];
}

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  { type: "phrase", timeoutMs: 45_000, stateType: "writing_phrase" },
  { type: "drawing", timeoutMs: 60_000, stateType: "drawing" },
  { type: "describing", timeoutMs: 45_000, stateType: "describing" },
];

export const PHASE_REGISTRY: Map<PhaseType, PhaseDefinition> = new Map(
  PHASE_DEFINITIONS.map((d) => [d.type, d]),
);

export function getPhaseDef(phase: PhaseType): PhaseDefinition {
  const def = PHASE_REGISTRY.get(phase);
  if (!def) throw new Error(`Unknown phase: ${phase}`);
  return def;
}
