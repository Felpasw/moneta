export const REALTIME_UPSTREAM_FACTORY = Symbol('REALTIME_UPSTREAM_FACTORY');

export interface RealtimeUpstream {
  send(data: Buffer | string): void;
  close(code?: number, reason?: string): void;
  onMessage(listener: (data: Buffer | string) => void): void;
  onClose(listener: (code: number, reason: Buffer) => void): void;
  onError(listener: (err: Error) => void): void;
  onOpen(listener: () => void): void;
}

export interface RealtimeUpstreamFactory {
  connect(userId: string): RealtimeUpstream;
}
