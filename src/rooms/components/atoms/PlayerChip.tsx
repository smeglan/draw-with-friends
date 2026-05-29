import type { Player } from "@/network/events";

type Props = {
  player: Player;
};

export function PlayerChip({ player }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
      <div className="h-2 w-2 rounded-full bg-green-400" />
      <span className="text-sm text-slate-200">{player.username}</span>
    </div>
  );
}
