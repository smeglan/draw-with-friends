"use client";

import type { PeerManager } from "./PeerManager";
import type { ChatMessage, DataChannelMessage } from "@/network/events";

export type ChatEventListener = () => void;

export class ChatManager {
  private _messages: ChatMessage[] = [];
  private listeners = new Set<ChatEventListener>();
  private peer: PeerManager;
  private _username: string;
  private unsubData: (() => void) | null = null;
  private unsubStatus: (() => void) | null = null;

  constructor(peer: PeerManager, username: string) {
    this.peer = peer;
    this._username = username;
  }

  get messages(): ChatMessage[] {
    return this._messages;
  }

  get username(): string {
    return this._username;
  }

  subscribe(cb: ChatEventListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  attach() {
    this.unsubData = this.peer.onData((raw: string) => {
      try {
        const msg: DataChannelMessage = JSON.parse(raw);
        if (msg.type === "chat") {
          this._messages = [...this._messages, msg.payload];
          this.notify();
        }
      } catch {
        // ignore malformed messages
      }
    });

    this.unsubStatus = this.peer.onStatusChange(() => {
      if (this.peer.status === "disconnected" || this.peer.status === "error") {
        this._messages = [
          ...this._messages,
          {
            id: "sys-" + Date.now(),
            username: "Sistema",
            text: "Conexión perdida con el otro jugador",
            timestamp: Date.now(),
          },
        ];
        this.notify();
      }
    });
  }

  sendMessage(text: string) {
    if (!text.trim()) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      username: this._username,
      text: text.trim(),
      timestamp: Date.now(),
    };

    const envelope: DataChannelMessage = { type: "chat", payload: msg };
    this.peer.send(JSON.stringify(envelope));

    this._messages = [...this._messages, msg];
    this.notify();
  }

  destroy() {
    this.unsubData?.();
    this.unsubStatus?.();
    this.listeners.clear();
    this._messages = [];
  }
}
