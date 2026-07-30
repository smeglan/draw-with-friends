import type { PeerManager } from "@/network/client/PeerManager";
import type { DataChannelMessage } from "@/network/events";

export interface TelephoneMessageBroker {
  broadcast(msg: DataChannelMessage): void;
  sendTo(targetId: string, msg: DataChannelMessage): void;
}

export class PeerManagerMessageBroker implements TelephoneMessageBroker {
  constructor(private peerManagers: Map<string, PeerManager>) {}

  broadcast(msg: DataChannelMessage): void {
    const raw = JSON.stringify(msg);
    for (const pm of this.peerManagers.values()) {
      pm.send(raw);
    }
  }

  sendTo(targetId: string, msg: DataChannelMessage): void {
    const pm = this.peerManagers.get(targetId);
    if (pm) pm.send(JSON.stringify(msg));
  }
}
