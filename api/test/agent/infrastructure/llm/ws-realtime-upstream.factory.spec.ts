import type { ClientOptions, WebSocket as WsWebSocket } from 'ws';

import { WsEvent } from '~/@common/infrastructure/websocket/ws-event';
import type { RealtimeUpstreamProvider } from '~/agent/domain/ports/realtime-upstream-provider';
import { WsRealtimeUpstreamFactory } from '~/agent/infrastructure/llm/ws-realtime-upstream.factory';

type Handler = (...args: unknown[]) => void;

class FakeWs {
  handlers: Record<string, Handler[]> = {};
  send = jest.fn();
  close = jest.fn();
  on(event: string, handler: Handler): this {
    (this.handlers[event] ??= []).push(handler);
    return this;
  }
  emit(event: string, ...args: unknown[]): void {
    for (const h of this.handlers[event] ?? []) h(...args);
  }
}

const buildProvider = (): RealtimeUpstreamProvider => ({
  buildConnectionConfig: () => ({
    url: 'wss://provider.test/stream',
    headers: { 'x-token': 'stub' },
  }),
});

describe('WsRealtimeUpstreamFactory', () => {
  it('opens WebSocket using the provider config (url + headers)', () => {
    const fakeWs = new FakeWs();
    const ctor: jest.Mock<WsWebSocket, [string, ClientOptions]> = jest.fn(
      () => fakeWs as unknown as WsWebSocket,
    );
    const factory = new WsRealtimeUpstreamFactory(buildProvider(), ctor);

    factory.connect();

    expect(ctor).toHaveBeenCalledTimes(1);
    const [url, options] = ctor.mock.calls[0];
    expect(url).toBe('wss://provider.test/stream');
    expect((options.headers as Record<string, string>)['x-token']).toBe('stub');
  });

  it('send() and close() delegate to the underlying WebSocket', () => {
    const fakeWs = new FakeWs();
    const factory = new WsRealtimeUpstreamFactory(
      buildProvider(),
      () => fakeWs as unknown as WsWebSocket,
    );

    const upstream = factory.connect();
    upstream.send('ping');
    upstream.close(1000, 'bye');

    expect(fakeWs.send).toHaveBeenCalledWith('ping');
    expect(fakeWs.close).toHaveBeenCalledWith(1000, 'bye');
  });

  it('normalizes ws message events (Buffer, ArrayBuffer, Buffer[]) to Buffer', () => {
    const fakeWs = new FakeWs();
    const factory = new WsRealtimeUpstreamFactory(
      buildProvider(),
      () => fakeWs as unknown as WsWebSocket,
    );
    const upstream = factory.connect();
    const seen: Array<Buffer | string> = [];
    upstream.onMessage((d) => seen.push(d));

    const b = Buffer.from('one');
    const ab = new Uint8Array([116, 119, 111]).buffer;
    const arr = [Buffer.from('th'), Buffer.from('ree')];

    fakeWs.emit(WsEvent.Message, b);
    fakeWs.emit(WsEvent.Message, ab);
    fakeWs.emit(WsEvent.Message, arr);

    expect(seen).toHaveLength(3);
    expect((seen[0] as Buffer).toString('utf8')).toBe('one');
    expect((seen[1] as Buffer).toString('utf8')).toBe('two');
    expect((seen[2] as Buffer).toString('utf8')).toBe('three');
  });

  it('wires close/error/open listeners onto the ws events', () => {
    const fakeWs = new FakeWs();
    const factory = new WsRealtimeUpstreamFactory(
      buildProvider(),
      () => fakeWs as unknown as WsWebSocket,
    );
    const upstream = factory.connect();

    const onClose = jest.fn();
    const onError = jest.fn();
    const onOpen = jest.fn();
    upstream.onClose(onClose);
    upstream.onError(onError);
    upstream.onOpen(onOpen);

    fakeWs.emit(WsEvent.Close, 1011, Buffer.from('nope'));
    fakeWs.emit(WsEvent.Error, new Error('kaboom'));
    fakeWs.emit(WsEvent.Open);

    expect(onClose).toHaveBeenCalledWith(1011, Buffer.from('nope'));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
