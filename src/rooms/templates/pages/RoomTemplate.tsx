"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/shared/icons";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";
import { ConnectionDot } from "@/rooms/components/atoms/ConnectionDot";
import { useRoom } from "@/rooms/hooks/useRoom";
import { RoomStatus } from "@/rooms/components/organisms/RoomStatus";

type Props = {
  roomId: string;
};

export function RoomTemplate({ roomId }: Props) {
  const { username, setUsername } = useUsername();
  const { players, isJoined, error, isConnected } = useRoom(roomId);
  const [dismissed, setDismissed] = useState(false);

  const showPrompt = !username && !dismissed;

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/lobby"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <Icon name="menu" className="h-3.5 w-3.5 rotate-90" />
            </Link>
            <h1 className="text-sm font-medium text-white">Sala: {roomId}</h1>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <ConnectionDot connected={isConnected} />
            <span className="text-xs text-slate-200">{username || "—"}</span>
          </div>
        </header>

        <RoomStatus
          players={players}
          isJoined={isJoined}
          error={error}
          isConnected={isConnected}
          roomId={roomId}
        />
      </div>

      {showPrompt && (
        <NamePrompt
          onSubmit={(name) => {
            setUsername(name);
            setDismissed(true);
          }}
        />
      )}
    </>
  );
}
