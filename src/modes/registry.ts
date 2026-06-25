import type { GameModeId, GameModeInfo } from "./types";

const MODES: GameModeInfo[] = [
  {
    id: "masterpiece",
    nameKey: "modes.masterpiece.name",
    descriptionKey: "modes.masterpiece.description",
    icon: "palette",
    minPlayers: 2,
  },
  {
    id: "fusion",
    nameKey: "modes.fusion.name",
    descriptionKey: "modes.fusion.description",
    icon: "combine",
    minPlayers: 2,
  },
  {
    id: "telephone",
    nameKey: "modes.telephone.name",
    descriptionKey: "modes.telephone.description",
    icon: "phone",
    minPlayers: 3,
  },
  {
    id: "pictionary",
    nameKey: "modes.pictionary.name",
    descriptionKey: "modes.pictionary.description",
    icon: "helpCircle",
    minPlayers: 2,
  },
];

export function getModeInfo(id: GameModeId): GameModeInfo | undefined {
  return MODES.find((m) => m.id === id);
}

export function getAvailableModes(playerCount: number): GameModeInfo[] {
  return MODES.filter((m) => playerCount >= m.minPlayers);
}

export { MODES };
