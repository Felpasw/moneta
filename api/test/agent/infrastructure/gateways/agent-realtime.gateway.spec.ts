import type { IncomingMessage } from 'node:http';

import { WsEvent } from '~/@common/infrastructure/websocket/ws-event';

import { AgentRealtimeGateway } from '~/agent/infrastructure/gateways/agent-realtime.gateway';
import type {
  RealtimeUpstream,
  RealtimeUpstreamFactory,
} from '~/agent/domain/ports/realtime-upstream';
import type {
  SynthesizeStreamParams,
  TtsService,
  TtsVoice,
} from '~/agent/domain/ports/tts-service';
import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';
import type { AssistantProfileRepository } from '~/agent/personality/domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '~/agent/personality/domain/types/assistant-profile';
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
  emitOpen(): void {
    for (const fn of this.openListeners) fn();
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

interface ControllableTts {
  tts: TtsService;
  handles: Array<{
    yield: (chunk: Buffer) => void;
    end: () => void;
    fail: (err: Error) => void;
    signal(): AbortSignal | undefined;
  }>;
}

const makeNoopTts = (): TtsService => ({
  synthesizeStream: async function* () {
    /* no-op — never yields */
  },
  listVoices: (): Promise<TtsVoice[]> => Promise.resolve([]),
});

const buildProfile = (
  patch: Partial<AssistantProfile> = {},
): AssistantProfile => ({
  id: 'p-1',
  userId: 'user-1',
  treatmentStyle: TreatmentStyle.Informal,
  voiceId: 'v-1',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...patch,
});

const makeProfileRepo = (
  profile: AssistantProfile | null,
): AssistantProfileRepository => ({
  findByUserId: jest.fn().mockResolvedValue(profile),
  create: jest.fn(),
  update: jest.fn(),
});

const makeFailingProfileRepo = (err: Error): AssistantProfileRepository => ({
  findByUserId: jest.fn().mockRejectedValue(err),
  create: jest.fn(),
  update: jest.fn(),
});

const makeControllableTts = (): ControllableTts => {
  const handles: ControllableTts['handles'] = [];
  const tts: TtsService = {
    async *synthesizeStream(params: SynthesizeStreamParams) {
      const queue: Array<Buffer | 'end' | Error> = [];
      let resolvePending: (() => void) | null = null;
      const push = (item: Buffer | 'end' | Error): void => {
        queue.push(item);
        if (resolvePending) {
          const r = resolvePending;
          resolvePending = null;
          r();
        }
      };
      handles.push({
        yield: (chunk) => push(chunk),
        end: () => push('end'),
        fail: (err) => push(err),
        signal: () => params.signal,
      });
      for (;;) {
        while (queue.length === 0) {
          await new Promise<void>((resolve) => {
            resolvePending = resolve;
          });
        }
        const item = queue.shift();
        if (item === 'end') return;
        if (item instanceof Error) throw item;
        if (params.signal?.aborted) return;
        yield item as Buffer;
      }
    },
    listVoices: (): Promise<TtsVoice[]> => Promise.resolve([]),
  };
  return { tts, handles };
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );

      const payload = Buffer.from('client->openai');
      client.emit(WsEvent.Message, payload);

      expect(upstream.sent).toEqual([payload]);
    });

    it('forwards upstream messages to client when socket is OPEN', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      client.emit(WsEvent.Close, Buffer.alloc(0));

      expect(upstream.closed).toBe(true);
    });

    it('closes client with upstream code when upstream closes', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(null),
      );
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

  describe('TTS pipeline integration', () => {
    const findTtsEvent = (
      client: FakeClient,
      type: string,
    ): Record<string, unknown> | undefined => {
      for (const [payload] of client.send.mock.calls as Array<[unknown]>) {
        if (typeof payload !== 'string') continue;
        try {
          const parsed = JSON.parse(payload) as Record<string, unknown>;
          if (parsed.type === type) return parsed;
        } catch {
          /* not JSON, ignore */
        }
      }
      return undefined;
    };

    const flushMicrotasks = (): Promise<void> =>
      new Promise((resolve) => setImmediate(resolve));

    it('synthesizes assistant text on response.text.done and streams tts.audio.delta + tts.audio.done to the client', async () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const { tts, handles } = makeControllableTts();
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        tts,
        makeProfileRepo(null),
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitMessage(
        JSON.stringify({ type: 'response.text.done', text: 'olá mundo' }),
      );
      await flushMicrotasks();
      handles[0].yield(Buffer.from([0xaa, 0xbb]));
      handles[0].end();
      await flushMicrotasks();
      await flushMicrotasks();

      const delta = findTtsEvent(client, 'tts.audio.delta');
      expect(delta).toBeDefined();
      expect(delta?.audio).toBe(Buffer.from([0xaa, 0xbb]).toString('base64'));
      expect(findTtsEvent(client, 'tts.audio.done')).toBeDefined();
    });

    it('cancels in-flight synthesis on input_audio_buffer.speech_started (barge-in) and emits tts.audio.canceled', async () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const { tts, handles } = makeControllableTts();
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        tts,
        makeProfileRepo(null),
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitMessage(
        JSON.stringify({ type: 'response.text.done', text: 'oi' }),
      );
      await flushMicrotasks();
      handles[0].yield(Buffer.from([1]));
      upstream.emitMessage(
        JSON.stringify({ type: 'input_audio_buffer.speech_started' }),
      );
      handles[0].end();
      await flushMicrotasks();

      expect(findTtsEvent(client, 'tts.audio.canceled')).toBeDefined();
      expect(handles[0].signal()?.aborted).toBe(true);
    });

    it('ignores non-JSON upstream frames without triggering TTS', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const { tts, handles } = makeControllableTts();
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        tts,
        makeProfileRepo(null),
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitMessage(Buffer.from('not-json'));
      upstream.emitMessage(JSON.stringify({ type: 'response.audio.delta' }));

      expect(handles).toHaveLength(0);
    });

    it('does not synthesize when response.text.done has an empty text', async () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const { tts, handles } = makeControllableTts();
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        tts,
        makeProfileRepo(null),
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitMessage(
        JSON.stringify({ type: 'response.text.done', text: '' }),
      );
      await flushMicrotasks();

      expect(handles).toHaveLength(0);
    });
  });

  describe('system prompt injection', () => {
    const flushMicrotasks = (): Promise<void> =>
      new Promise((resolve) => setImmediate(resolve));

    const findSessionUpdate = (
      upstream: FakeUpstream,
    ): { instructions: string } | undefined => {
      for (const payload of upstream.sent) {
        if (typeof payload !== 'string') continue;
        try {
          const parsed = JSON.parse(payload) as {
            type?: string;
            session?: { instructions?: string };
          };
          if (
            parsed.type === 'session.update' &&
            parsed.session?.instructions
          ) {
            return { instructions: parsed.session.instructions };
          }
        } catch {
          /* not JSON */
        }
      }
      return undefined;
    };

    it('sends session.update with a prompt containing the very-informal snippet when profile is very_informal', async () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-vi' }));
      const factory = makeFactory(upstream);
      const repo = makeProfileRepo(
        buildProfile({
          userId: 'user-vi',
          treatmentStyle: TreatmentStyle.VeryInformal,
        }),
      );
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        repo,
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitOpen();
      await flushMicrotasks();

      const event = findSessionUpdate(upstream);
      expect(event).toBeDefined();
      expect(event?.instructions).toMatch(/muito informal/i);
      expect(event?.instructions).toMatch(/zoa/i);
    });

    it('sends session.update with the formal snippet when profile is formal', async () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-f' }));
      const factory = makeFactory(upstream);
      const repo = makeProfileRepo(
        buildProfile({
          userId: 'user-f',
          treatmentStyle: TreatmentStyle.Formal,
        }),
      );
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        repo,
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitOpen();
      await flushMicrotasks();

      const event = findSessionUpdate(upstream);
      expect(event?.instructions).toMatch(/formalidade/i);
    });

    it('falls back to the default treatment style when profile is missing', async () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-no-profile' }));
      const factory = makeFactory(upstream);
      const repo = makeProfileRepo(null);
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        repo,
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitOpen();
      await flushMicrotasks();

      const event = findSessionUpdate(upstream);
      expect(event?.instructions).toMatch(/informal/i);
    });

    it('does not inject prompt before upstream opens', () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        makeProfileRepo(buildProfile()),
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );

      expect(findSessionUpdate(upstream)).toBeUndefined();
    });

    it('logs and swallows repository errors without breaking the connection', async () => {
      const upstream = new FakeUpstream();
      const tokens = makeTokenService(() => ({ sub: 'user-1' }));
      const factory = makeFactory(upstream);
      const repo = makeFailingProfileRepo(new Error('db down'));
      const gateway = new AgentRealtimeGateway(
        tokens,
        factory.asPort,
        makeNoopTts(),
        repo,
      );
      const client = makeClient();

      gateway.handleConnection(
        client as unknown as Parameters<typeof gateway.handleConnection>[0],
        makeReq({ token: 'ok' }),
      );
      upstream.emitOpen();
      await flushMicrotasks();

      expect(client.close).not.toHaveBeenCalled();
      expect(findSessionUpdate(upstream)).toBeUndefined();
    });
  });
});
