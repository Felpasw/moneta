import type { WebSocket } from 'ws';

const WS_READY_STATE_OPEN = 1;

interface ClientEvent {
  readonly type: string;
  readonly [key: string]: unknown;
}

export const sendClientEvent = (
  client: WebSocket,
  event: ClientEvent,
): void => {
  if (client.readyState !== WS_READY_STATE_OPEN) return;
  client.send(JSON.stringify(event));
};
