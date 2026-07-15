import type { IncomingMessage } from 'node:http';

import { AgentRealtimeGateway } from '~/agent/infrastructure/gateways/agent-realtime.gateway';
import type {
  RealtimeUpstream,
  RealtimeUpstreamFactory,
} from '~/agent/domain/ports/realtime-upstream';
import type { TokenService } from '~/auth/domain/services/token-service';

type Listener<T extends unknown[]> = (...args: T) => void;

class FakeUpstream implements RealtimeUpstream {
  sent: Array<Buffer | string> = [];
  closed = false;
  closeCode?: number;
  private messageListeners: Array<Listener<[Buffer | string]>> = [];
  private closeListeners: Array<Listener<[number, Buffer]>> = [];
  private errorListeners: Array<Listener<[Error]>> = [];
  private openListeners: Array<Listener<[]>> = [];

  send(data: Buffer | string): void {
    this.sent.push(data);
  }
  close(code?: number): void {
    this.closed = true;
    this.closeCode = code;
  }
  onMessage(fn: Listener<[Buffer | string]>): void {
    this.messageListeners.push(fn);
  }
  onClose(fn: Listener<[number, Buffer]>): void {
    this.closeListeners.push(fn);
  }
  onError(fn: Listener<[Error]>): void {
    this.errorListeners.push(fn);
  }
  onOpen(fn: Listener<[]>): void {
    this.openListeners.push(fn);
  }

  emitMessage(data: Buffer | string): void {
    for (const fn of this.messageListeners) fn(data);
  }
  emitClose(code: number, reason: Buffer): void {
    for (const fn of this.closeListeners) fn(code, reason);
  }
  emitError(err: Error): void {
    for (const fn of this.errorListeners) fn(err);
  }
}

interface FakeClient {
  readyState: number;
  OPEN: number;
  send: jest.Mock;
  close: jest.Mock;
  on: jest.Mock;
  __handlers: Record<string, Listener<[Buffer]>>;
  emit: (event: string, payload: Buffer) => void;
}

const makeClient = (): FakeClient => {
  const handlers: Record<string, Listener<[Buffer]>> = {};
  return {
    readyState: 1,
    OPEN: 1,
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn((event: string, fn: Listener<[Buffer]>) => {
      handlers[event] = fn;
    }),
    __handlers: handlers,
    emit: (event: string, payload: Buffer): void => {
      handlers[event]?.(payload);
    },
  };
};

const makeTokenService = (
  verifier: (token: string) => { sub: string },
): TokenService => ({
  signAccess: jest.fn(),
  signRefresh: jest.fn(),
  verifyAccess: jest.fn((token: string) => {
    const decoded = verifier(token);
    return { ...decoded, iat: 0, exp: 0 };
  }),
  verifyRefresh: jest.fn(),
});

interface FakeFactory {
  connect: jest.Mock<RealtimeUpstream, [string]>;
  asPort: RealtimeUpstreamFactory;
}

const makeFactory = (upstream: FakeUpstream): FakeFactory => {
  const connect: jest.Mock<RealtimeUpstream, [string]> = jest.fn(
    () => upstream,
  );
  return { connect, asPort: { connect } };
};

const makeReq = (opts: { token?: string; proto?: string }): IncomingMessage => {
  const query = opts.token ? `?token=${encodeURIComponent(opts.token)}` : '';
  const headers = opts.proto ? { 'sec-websocket-protocol': opts.proto } : {};
  return {
    url: `/agent/ws${query}`,
    headers,
  } as unknown as IncomingMessage;
};

describe('AgentRealtimeGateway', () => {
  describe('handshake auth', () => {
    it('closes with 4401 when token is missing', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => {
        throw new Error('should not verify');
      });
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({}),
      );

      expect(client.close).toHaveBeenCalledWith(4401, 'unauthorized');
      expect(factory.connect).not.toHaveBeenCalled();
    });

    it('closes with 4401 when token verification throws', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => {
        throw new Error('invalid');
      });
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'bad' }),
      );

      expect(client.close).toHaveBeenCalledWith(4401, 'unauthorized');
      expect(factory.connect).not.toHaveBeenCalled();
    });

    it('accepts token from query string and connects upstream with userId', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-42' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'good' }),
      );

      expect(client.close).not.toHaveBeenCalled();
      expect(factory.connect).toHaveBeenCalledWith('user-42');
    });

    it('accepts token from sec-websocket-protocol subprotocol', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-9' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ proto: 'bearer.good-token' }),
      );

      expect(factory.connect).toHaveBeenCalledWith('user-9');
    });
  });

  describe('frame relay', () => {
    it('forwards client messages to upstream', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );

      const payload = Buffer.from('client->openai');
      client.emit('message', payload);

      expect(upstream.sent).toEqual([payload]);
    });

    it('forwards upstream messages to client when socket is OPEN', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );

      upstream.emitMessage('openai->client');

      expect(client.send).toHaveBeenCalledWith('openai->client');
    });

    it('does not forward upstream messages when client socket is not OPEN', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();
      client.readyState = 3;

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );

      upstream.emitMessage('dropped');

      expect(client.send).not.toHaveBeenCalled();
    });
  });

  describe('close propagation', () => {
    it('closes upstream when client disconnects', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      client.emit('close', Buffer.alloc(0));

      expect(upstream.closed).toBe(true);
    });

    it('closes client with upstream code when upstream closes', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );

      upstream.emitClose(1011, Buffer.from('upstream-gone'));

      expect(client.close).toHaveBeenCalledWith(1011, 'upstream-gone');
    });

    it('closes client with 4500 when upstream errors', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );

      upstream.emitError(new Error('boom'));

      expect(client.close).toHaveBeenCalledWith(4500, 'upstream_error');
    });

    it('handleDisconnect closes upstream', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(tokens, factory.asPort);
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      gateway.handleDisconnect(
        client as unknown as Parameters<typeof gateway.handleDisconnect>[0],
      );

      expect(upstream.closed).toBe(true);
    });
  });
});
