"use client";

import type { GamePhase } from "@/network/events";

export type GameState = {
  phase: GamePhase;
  activeMode: string | null;
  startedAt: number | null;
};

export type GameStateListener = () => void;

export class GameLifecycle {
  private _state: GameState = { phase: "lobby", activeMode: null, startedAt: null };
  private listeners = new Set<GameStateListener>();

  get state(): GameState {
    return this._state;
  }

  subscribe(cb: GameStateListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  startGame(mode: string) {
    this._state = { phase: "playing", activeMode: mode, startedAt: Date.now() };
    this.notify();
  }

  endGame() {
    this._state = { ...this._state, phase: "results" };
    this.notify();
  }

  restart() {
    this._state = { phase: "lobby", activeMode: null, startedAt: null };
    this.notify();
  }

  destroy() {
    this.listeners.clear();
  }
}
