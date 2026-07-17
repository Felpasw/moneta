import type { WebSocket } from 'ws';

const WS_READY_STATE_OPEN = 1;

interface TtsEvent {
  readonly type: string;
  readonly [key: string]: unknown;
}

export const sendTtsEvent = (client: WebSocket, event: TtsEvent): void => {
  if (client.readyState !== WS_READY_STATE_OPEN) return;
  client.send(JSON.stringify(event));
};
