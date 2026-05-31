declare module "simple-peer" {
  interface SimplePeerOptions {
    initiator?: boolean;
    trickle?: boolean;
    channelName?: string;
    config?: RTCConfiguration;
    offerOptions?: RTCOfferOptions;
    answerOptions?: RTCAnswerOptions;
    sdpTransform?: (sdp: string) => string;
  }

  interface SimplePeer {
    signal(data: unknown): void;
    send(data: string | Buffer | ArrayBufferView | ArrayBuffer): void;
    destroy(error?: Error): void;
    on(event: "signal", cb: (data: unknown) => void): this;
    on(event: "connect", cb: () => void): this;
    on(event: "data", cb: (data: Buffer) => void): this;
    on(event: "close", cb: () => void): this;
    on(event: "error", cb: (err: Error) => void): this;
    on(event: string, cb: (...args: unknown[]) => void): this;
    off(event: string, cb: (...args: unknown[]) => void): this;
    removeListener(event: string, cb: (...args: unknown[]) => void): this;
    removeAllListeners(event?: string): this;
    get destroyed(): boolean;
    get connected(): boolean;
  }

  interface SimplePeerStatic {
    new (opts?: SimplePeerOptions): SimplePeer;
    (opts?: SimplePeerOptions): SimplePeer;
  }

  declare const SimplePeer: SimplePeerStatic;
  export default SimplePeer;
}
