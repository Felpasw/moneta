import type { ClientOptions, WebSocket as WsWebSocket } from 'ws';

import { env } from '../../../../../config/env';
import type {
  RealtimeUpstream,
  RealtimeUpstreamFactory,
} from '../../../../domain/ports/realtime-upstream';

const REALTIME_URL_BASE = 'wss://api.openai.com/v1/realtime';
const REALTIME_MODEL = 'gpt-4o-realtime-preview';

export type WsConstructor = (
  url: string,
  options: ClientOptions,
) => WsWebSocket;

class WsRealtimeUpstream implements RealtimeUpstream {
  constructor(private readonly ws: WsWebSocket) {}

  send(data: Buffer | string): void {
    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }

  onMessage(listener: (data: Buffer | string) => void): void {
    this.ws.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
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
    this.ws.on('close', listener);
  }

  onError(listener: (err: Error) => void): void {
    this.ws.on('error', listener);
  }

  onOpen(listener: () => void): void {
    this.ws.on('open', listener);
  }
}

export class OpenAiRealtimeUpstreamFactory implements RealtimeUpstreamFactory {
  constructor(private readonly wsCtor: WsConstructor) {}

  connect(): RealtimeUpstream {
    const url = `${REALTIME_URL_BASE}?model=${REALTIME_MODEL}`;
    const ws = this.wsCtor(url, {
      headers: {
        Authorization: `Bearer ${env.LLM_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });
    return new WsRealtimeUpstream(ws);
  }
}
