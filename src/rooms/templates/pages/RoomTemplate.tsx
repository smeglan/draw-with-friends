"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { Icon } from "@/shared/icons";
import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";
import { ConnectionDot } from "@/rooms/components/atoms/ConnectionDot";
import { PlayerSidebar } from "@/rooms/components/organisms/PlayerSidebar";
import { RoomCanvas } from "@/rooms/components/organisms/RoomCanvas";
import { ChatBox } from "@/network/client/components/ChatBox";
import { useRoomOrchestrator } from "@/network/client/useRoomOrchestrator";

type Props = {
  roomId: string;
};

export function RoomTemplate({ roomId }: Props) {
  const { username, setUsername } = useUsername();
  const { state, sendChat, sendStroke, onStroke } = useRoomOrchestrator(roomId, username);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const showPrompt = !username && !dismissed;
  const showChat = state.isJoined && state.players.length >= 2;
  const hostUsername = state.players.find((p) => p.id === state.hostId)?.username ?? null;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/room/${roomId}`;
    if (navigator.share) {
      navigator.share({ title: "Los Pibes Que Dibujan", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomId]);

  const handleStrokeComplete = useCallback((strokeData: Parameters<typeof sendStroke>[0]) => {
    sendStroke(strokeData);
  }, [sendStroke]);

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href="/lobby"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
              title="Salir de la sala"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
            </Link>
            <h1 className="text-sm font-medium text-white">Sala: {roomId}</h1>
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
              title={copied ? "¡Copiado!" : "Copiar código de sala"}
            >
              {copied ? (
                <span className="text-xs font-medium text-green-400">OK</span>
              ) : (
                <Icon name="copy" className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
              title="Compartir sala"
            >
              <Icon name="share" className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
              <ConnectionDot connected={state.isConnected} />
              <span className="text-xs text-slate-200">{username || "—"}</span>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <PlayerSidebar
            players={state.players}
            hostId={state.hostId}
            isJoined={state.isJoined}
            error={state.error}
            isConnected={state.isConnected}
            peerStatus={state.peerStatus}
            roomId={roomId}
          />

          <RoomCanvas
            onStrokeComplete={handleStrokeComplete}
            onStrokeReceived={onStroke}
            myId={state.myId}
          />

          {showChat && (
            <div className="w-80 shrink-0 border-l border-white/10">
              <ChatBox
                messages={state.messages}
                onSend={sendChat}
                isConnected={state.peerStatus === "connected"}
                currentUsername={username}
                hostUsername={hostUsername}
              />
            </div>
          )}
        </div>
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
