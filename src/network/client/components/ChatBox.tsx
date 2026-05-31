"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/shared/icons";
import type { ChatMessage } from "@/network/events";

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isConnected: boolean;
  currentUsername: string;
  hostUsername: string | null;
};

const CHAT_COLORS = [
  "text-cyan-400",
  "text-pink-400",
  "text-green-400",
  "text-orange-400",
  "text-purple-400",
  "text-yellow-400",
  "text-rose-400",
  "text-teal-400",
];

function getColorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHAT_COLORS[Math.abs(hash) % CHAT_COLORS.length];
}

const SELF_COLOR = "text-cyan-400";

export function ChatBox({ messages, onSend, isConnected, currentUsername, hostUsername }: Props) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-4 py-2">
        <p className="text-xs font-medium text-slate-400">
          Chat {isConnected ? "● Conectado" : "○ Desconectado"}
        </p>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="pt-4 text-center text-xs text-slate-500">
            {isConnected
              ? "Sin mensajes todavía"
              : "Esperando conexión P2P..."}
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = msg.username === currentUsername;
          const userColor = isOwn ? SELF_COLOR : getColorForUsername(msg.username);
          const isHost = msg.username === hostUsername;

          return (
            <div key={msg.id} className={`flex ${isOwn ? "flex-row-reverse" : ""}`}>
              <div className={`max-w-[85%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`flex items-center gap-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className={`text-xs font-medium ${userColor}`}>
                    {isOwn ? "Tú" : msg.username}
                  </span>
                  {isHost && (
                    <Icon name="crown" className="h-3 w-3 text-amber-400" />
                  )}
                  <span className="text-[10px] text-slate-600">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`mt-0.5 rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    isOwn
                      ? "rounded-tr-sm bg-cyan-500/15 text-slate-100"
                      : "rounded-tl-sm bg-white/10 text-slate-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 border-t border-white/10 p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isConnected ? "Escribe un mensaje..." : "Conectando..."}
          disabled={!isConnected}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
