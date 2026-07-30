"use client";

import type { PeerManager } from "@/network/client/PeerManager";
import type { DataChannelMessage, StrokeData } from "@/network/events";
import type { TelephoneGameState } from "./types";
import { HostHandler } from "./HostHandler";
import { ClientHandler } from "./ClientHandler";
import { PeerManagerMessageBroker } from "./TelephoneMessageBroker";

export class TelephoneManager {
  private hostHandler: HostHandler | null = null;
  private clientHandler: ClientHandler | null = null;
  private broker: PeerManagerMessageBroker;
  private isHost = false;

  constructor(
    peerManagers: Map<string, PeerManager>,
    private myId: string,
    private onStateChange: (partial: Partial<TelephoneGameState>) => void,
    private onGameEnd: (() => void) | null = null,
  ) {
    this.broker = new PeerManagerMessageBroker(peerManagers);
  }

  restart(): void {
    this.hostHandler?.restart();
    this.clientHandler?.restart();
  }

  startGame(mode: string, playerIds: string[], totalRounds = 3, isHost: boolean): void {
    this.isHost = isHost;

    if (isHost) {
      this.hostHandler = new HostHandler(
        this.broker,
        this.myId,
        this.onStateChange,
        () => this.onGameEnd?.(),
      );
      this.hostHandler.startGame(playerIds, totalRounds);
    } else {
      this.clientHandler = new ClientHandler(this.onStateChange);
      this.clientHandler.setPlayerIds(playerIds);
    }
  }

  handleMessage(senderId: string, msg: DataChannelMessage): void {
    if (this.isHost) {
      this.hostHandler?.handleSubmission(senderId, msg);
    } else {
      this.clientHandler?.handleMessage(senderId, msg);
    }
  }

  removePlayer(playerId: string): void {
    this.hostHandler?.removePlayer(playerId);
  }

  destroy(): void {
    this.hostHandler?.destroy();
    this.hostHandler = null;
    this.clientHandler = null;
  }
}
