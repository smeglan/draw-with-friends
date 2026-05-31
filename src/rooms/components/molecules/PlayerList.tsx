import type { Player } from "@/network/events";
import { PlayerChip } from "@/rooms/components/atoms/PlayerChip";

type Props = {
  players: Player[];
  hostId?: string | null;
};

export function PlayerList({ players, hostId }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {players.map((player) => (
        <PlayerChip key={player.id} player={player} isHost={player.id === hostId} />
      ))}
    </div>
  );
}
