"use client";

import SimplePeer from "simple-peer";

export type PeerStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface PeerManagerConfig {
  initiator: boolean;
  signalRelay: (targetId: string, signal: unknown) => void;
  targetPeerId: string;
  iceServers: RTCIceServer[];
}

export type PeerEventListener = () => void;

export class PeerManager {
  private peer: SimplePeer | null = null;
  private _status: PeerStatus = "idle";
  private statusListeners = new Set<PeerEventListener>();
  private dataListeners = new Set<(data: string) => void>();
  private _config: PeerManagerConfig;

  constructor(config: PeerManagerConfig) {
    this._config = config;
  }

  get status(): PeerStatus {
    return this._status;
  }

  get config(): PeerManagerConfig {
    return this._config;
  }

  onStatusChange(cb: PeerEventListener): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  onData(cb: (data: string) => void): () => void {
    this.dataListeners.add(cb);
    return () => this.dataListeners.delete(cb);
  }

  private setStatus(status: PeerStatus) {
    this._status = status;
    this.statusListeners.forEach((cb) => cb());
  }

  private notifyData(data: string) {
    this.dataListeners.forEach((cb) => cb(data));
  }

  connect() {
    if (this.peer) return;

    this.setStatus("connecting");

    this.peer = new SimplePeer({
      initiator: this._config.initiator,
      trickle: true,
      config: {
        iceServers: this._config.iceServers,
      },
    });

    this.peer.on("signal", (signal: unknown) => {
      console.log(
        "[PeerManager] signal emit → relay to",
        this._config.targetPeerId,
      );
      this._config.signalRelay(this._config.targetPeerId, signal);
    });

    this.peer.on("connect", () => {
      console.log("[PeerManager] connected");
      this.setStatus("connected");
    });

    this.peer.on("data", (data: Buffer) => {
      this.notifyData(data.toString());
    });

    this.peer.on("close", () => {
      console.log("[PeerManager] close");
      this.setStatus("disconnected");
    });

    this.peer.on("error", (err: Error) => {
      console.error("[PeerManager] error:", err);
      this.setStatus("error");
    });
  }

  handleSignal(signal: unknown) {
    if (!this.peer) return;
    this.peer.signal(signal);
  }

  send(data: string) {
    if (!this.peer || !this.peer.connected) return;
    this.peer.send(data);
  }

  destroy() {
    if (this.peer) {
      this.peer.removeAllListeners?.("signal");
      this.peer.removeAllListeners?.("connect");
      this.peer.removeAllListeners?.("data");
      this.peer.removeAllListeners?.("close");
      this.peer.removeAllListeners?.("error");
      this.peer.destroy();
      this.peer = null;
    }
    this.setStatus("disconnected");
    this.statusListeners.clear();
    this.dataListeners.clear();
  }
}
