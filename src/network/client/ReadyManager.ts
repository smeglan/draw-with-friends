"use client";

import type { PeerManager } from "./PeerManager";
import type { DataChannelMessage } from "@/network/events";

export type ReadyEventListener = () => void;

export class ReadyManager {
  private _readyPlayers: string[] = [];
  private listeners = new Set<ReadyEventListener>();
  private peer: PeerManager;
  private playerId: string;
  private unsubData: (() => void) | null = null;

  constructor(peer: PeerManager, playerId: string, initialReady: string[] = []) {
    this.peer = peer;
    this.playerId = playerId;
    this._readyPlayers = initialReady;
  }

  get readyPlayers(): string[] {
    return this._readyPlayers;
  }

  subscribe(cb: ReadyEventListener): () => void {
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
        if (msg.type !== "ready_change") return;

        if (msg.payload.ready) {
          if (!this._readyPlayers.includes(msg.payload.playerId)) {
            this._readyPlayers = [...this._readyPlayers, msg.payload.playerId];
            this.notify();
          }
        } else {
          this._readyPlayers = this._readyPlayers.filter((id) => id !== msg.payload.playerId);
          this.notify();
        }
      } catch {
        // ignore malformed messages
      }
    });
  }

  toggleReady() {
    const isReady = this._readyPlayers.includes(this.playerId);
    const envelope: DataChannelMessage = {
      type: "ready_change",
      payload: { playerId: this.playerId, ready: !isReady },
    };
    this.peer.send(JSON.stringify(envelope));

    if (isReady) {
      this._readyPlayers = this._readyPlayers.filter((id) => id !== this.playerId);
    } else {
      this._readyPlayers = [...this._readyPlayers, this.playerId];
    }
    this.notify();
  }

  resetReady() {
    if (this._readyPlayers.length === 0) return;
    this._readyPlayers = [];
    this.notify();
  }

  destroy() {
    this.unsubData?.();
    this.listeners.clear();
  }
}
