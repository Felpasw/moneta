import type { WebSocket as WsWebSocket } from 'ws';

import { WsEvent } from '../../../@common/infrastructure/websocket/ws-event';
import type { RealtimeUpstream } from '../../domain/ports/realtime-upstream';

export class WsRealtimeUpstream implements RealtimeUpstream {
  constructor(private readonly ws: WsWebSocket) {}

  send(data: Buffer | string): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }

  onMessage(listener: (data: Buffer | string) => void): void {
    this.ws.on(WsEvent.Message, (raw: Buffer | ArrayBuffer | Buffer[]) => {
      if (Buffer.isBuffer(raw)) {
        listener(raw);
        return;
      }
      if (Array.isArray(raw)) {
        listener(Buffer.concat(raw));
        return;
      }
      listener(Buffer.from(raw));
    });
  }

  onClose(listener: (code: number, reason: Buffer) => void): void {
    this.ws.on(WsEvent.Close, listener);
  }

  onError(listener: (err: Error) => void): void {
    this.ws.on(WsEvent.Error, listener);
  }

  onOpen(listener: () => void): void {
    this.ws.on(WsEvent.Open, listener);
  }
}
