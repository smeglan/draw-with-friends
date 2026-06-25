"use client";

import type { PeerManager } from "./PeerManager";
import type { DataChannelMessage } from "@/network/events";
import type { ModeSelectionState, GameModeId } from "@/modes/types";

export type VoteEventListener = () => void;

export class VoteManager {
  private _modeSelection: ModeSelectionState = { type: "none" };
  private listeners = new Set<VoteEventListener>();
  private peer: PeerManager;
  private playerId: string;
  private unsubData: (() => void) | null = null;
  private voteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(peer: PeerManager, playerId: string, initial: ModeSelectionState = { type: "none" }) {
    this.peer = peer;
    this.playerId = playerId;
    this._modeSelection = initial;
  }

  get modeSelection(): ModeSelectionState {
    return this._modeSelection;
  }

  subscribe(cb: VoteEventListener): () => void {
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
        switch (msg.type) {
          case "vote_started":
            this._modeSelection = {
              type: "voting",
              candidates: msg.payload.candidates as GameModeId[],
              votes: {},
            };
            this.notify();
            break;
          case "vote_cast":
            if (this._modeSelection.type !== "voting") break;
            this._modeSelection = {
              ...this._modeSelection,
              votes: {
                ...this._modeSelection.votes,
                [msg.payload.playerId]: msg.payload.mode as GameModeId,
              },
            };
            this.notify();
            break;
          case "vote_ended":
            this._modeSelection = { type: "voting_complete", mode: msg.payload.winner as GameModeId };
            this.notify();
            break;
          case "mode_selected":
            this._modeSelection = { type: "host_picked", mode: msg.payload.mode as GameModeId };
            this.notify();
            break;
          case "mode_reset":
            this._modeSelection = { type: "none" };
            this.notify();
            break;
        }
      } catch {
        // ignore malformed messages
      }
    });
  }

  startVote(candidates: GameModeId[]) {
    const envelope: DataChannelMessage = {
      type: "vote_started",
      payload: { candidates },
    };
    this.peer.send(JSON.stringify(envelope));
    this._modeSelection = { type: "voting", candidates, votes: {} };
    this.notify();

    this.voteTimer = setTimeout(() => {
      this.endVote();
    }, 60000);
  }

  castVote(mode: GameModeId) {
    if (this._modeSelection.type !== "voting") return;
    const envelope: DataChannelMessage = {
      type: "vote_cast",
      payload: { playerId: this.playerId, mode },
    };
    this.peer.send(JSON.stringify(envelope));
    this._modeSelection = {
      ...this._modeSelection,
      votes: { ...this._modeSelection.votes, [this.playerId]: mode },
    };
    this.notify();
  }

  endVote() {
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = null;
    }
    if (this._modeSelection.type !== "voting") return;
    if (Object.keys(this._modeSelection.votes).length === 0) {
      this._modeSelection = { type: "none" };
      this.notify();
      return;
    }

    const counts = new Map<GameModeId, number>();
    let winner: GameModeId = Object.values(this._modeSelection.votes)[0];
    let max = 0;
    for (const mode of Object.values(this._modeSelection.votes)) {
      const count = (counts.get(mode) ?? 0) + 1;
      counts.set(mode, count);
      if (count > max) {
        max = count;
        winner = mode;
      }
    }

    const envelope: DataChannelMessage = { type: "vote_ended", payload: { winner } };
    this.peer.send(JSON.stringify(envelope));
    this._modeSelection = { type: "voting_complete", mode: winner };
    this.notify();
  }

  hostSelectMode(mode: GameModeId) {
    const envelope: DataChannelMessage = { type: "mode_selected", payload: { mode } };
    this.peer.send(JSON.stringify(envelope));
    this._modeSelection = { type: "host_picked", mode };
    this.notify();
  }

  changeMode() {
    const envelope: DataChannelMessage = { type: "mode_reset", payload: {} };
    this.peer.send(JSON.stringify(envelope));
    this._modeSelection = { type: "none" };
    this.notify();
  }

  destroy() {
    if (this.voteTimer) {
      clearTimeout(this.voteTimer);
      this.voteTimer = null;
    }
    this.unsubData?.();
    this.listeners.clear();
  }
}
