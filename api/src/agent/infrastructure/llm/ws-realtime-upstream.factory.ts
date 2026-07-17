import type { ClientOptions, WebSocket as WsWebSocket } from 'ws';

import type {
  RealtimeUpstream,
  RealtimeUpstreamFactory,
} from '../../domain/ports/realtime-upstream';
import type { RealtimeUpstreamProvider } from '../../domain/ports/realtime-upstream-provider';
import { WsRealtimeUpstream } from './ws-realtime-upstream';

export type WsConstructor = (
  url: string,
  options: ClientOptions,
) => WsWebSocket;

export class WsRealtimeUpstreamFactory implements RealtimeUpstreamFactory {
  constructor(
    private readonly provider: RealtimeUpstreamProvider,
    private readonly wsCtor: WsConstructor,
  ) {}

  connect(): RealtimeUpstream {
    const { url, headers } = this.provider.buildConnectionConfig();
    const ws = this.wsCtor(url, { headers });
    return new WsRealtimeUpstream(ws);
  }
}
