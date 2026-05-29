import type { Player } from "@/network/events";
import { PlayerChip } from "@/rooms/components/atoms/PlayerChip";

type Props = {
  players: Player[];
};

export function PlayerList({ players }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {players.map((player) => (
        <PlayerChip key={player.id} player={player} />
      ))}
    </div>
  );
}
