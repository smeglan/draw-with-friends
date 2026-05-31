import type { Player } from "@/network/events";

type Props = {
  player: Player;
  isHost?: boolean;
};

export function PlayerChip({ player, isHost }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
      <div className="h-2 w-2 rounded-full bg-green-400" />
      <span className="text-sm text-slate-200">{player.username}</span>
      {isHost && (
        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
          HOST
        </span>
      )}
    </div>
  );
}
