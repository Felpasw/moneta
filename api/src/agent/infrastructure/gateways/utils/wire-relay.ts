import type { Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';

import { WsEvent } from '../../../../@common/infrastructure/websocket/ws-event';
import type { RealtimeUpstream } from '../../../domain/ports/realtime-upstream';
import { CLOSE_UPSTREAM_ERROR } from '../constants/close-codes';

const WS_READY_STATE_OPEN = 1;

interface RelayContext {
  client: WebSocket;
  upstream: RealtimeUpstream;
  logger: Logger;
  userId: string;
}

const isOpen = (client: WebSocket): boolean =>
  client.readyState === WS_READY_STATE_OPEN;

export const wireRelay = (ctx: RelayContext): void => {
  const { client, upstream, logger, userId } = ctx;

  upstream.onMessage((data) => {
    if (isOpen(client)) client.send(data);
  });

  upstream.onClose((code, reason) => {
    if (isOpen(client)) client.close(code, reason.toString('utf8'));
  });

  upstream.onError((err) => {
    logger.error(`upstream error for ${userId}: ${err.message}`);
    if (isOpen(client)) client.close(CLOSE_UPSTREAM_ERROR, 'upstream_error');
  });

  client.on(WsEvent.Message, (raw: Buffer) => upstream.send(raw));
  client.on(WsEvent.Close, () => upstream.close());
};
