import type { ClientOptions, WebSocket as WsWebSocket } from 'ws';

import { OpenAiRealtimeUpstreamFactory } from '~/agent/infrastructure/llm/providers/openai/openai-realtime-upstream.factory';

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

describe('OpenAiRealtimeUpstreamFactory', () => {
  it('opens WebSocket to the realtime URL with model query and required headers', () => {
    const fakeWs = new FakeWs();
    const ctor: jest.Mock<WsWebSocket, [string, ClientOptions]> = jest.fn(
      () => fakeWs as unknown as WsWebSocket,
    );
    const factory = new OpenAiRealtimeUpstreamFactory(ctor);

    factory.connect();

    expect(ctor).toHaveBeenCalledTimes(1);
    const [url, options] = ctor.mock.calls[0];
    expect(url).toBe(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
    );
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Bearer /);
    expect(headers['OpenAI-Beta']).toBe('realtime=v1');
  });

  it('send() and close() delegate to the underlying WebSocket', () => {
    const fakeWs = new FakeWs();
    const factory = new OpenAiRealtimeUpstreamFactory(
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
    const factory = new OpenAiRealtimeUpstreamFactory(
      () => fakeWs as unknown as WsWebSocket,
    );
    const upstream = factory.connect();
    const seen: Array<Buffer | string> = [];
    upstream.onMessage((d) => seen.push(d));

    const b = Buffer.from('one');
    const ab = new Uint8Array([116, 119, 111]).buffer;
    const arr = [Buffer.from('th'), Buffer.from('ree')];

    fakeWs.emit('message', b);
    fakeWs.emit('message', ab);
    fakeWs.emit('message', arr);

    expect(seen).toHaveLength(3);
    expect((seen[0] as Buffer).toString('utf8')).toBe('one');
    expect((seen[1] as Buffer).toString('utf8')).toBe('two');
    expect((seen[2] as Buffer).toString('utf8')).toBe('three');
  });

  it('wires close/error/open listeners onto the ws events', () => {
    const fakeWs = new FakeWs();
    const factory = new OpenAiRealtimeUpstreamFactory(
      () => fakeWs as unknown as WsWebSocket,
    );
    const upstream = factory.connect();

    const onClose = jest.fn();
    const onError = jest.fn();
    const onOpen = jest.fn();
    upstream.onClose(onClose);
    upstream.onError(onError);
    upstream.onOpen(onOpen);

    fakeWs.emit('close', 1011, Buffer.from('nope'));
    fakeWs.emit('error', new Error('kaboom'));
    fakeWs.emit('open');

    expect(onClose).toHaveBeenCalledWith(1011, Buffer.from('nope'));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
