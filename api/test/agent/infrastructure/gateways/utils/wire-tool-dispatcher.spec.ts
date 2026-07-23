import type { Logger } from '@nestjs/common';

import type { RealtimeUpstream } from '~/agent/domain/ports/realtime-upstream';
import { wireToolDispatcher } from '~/agent/infrastructure/gateways/utils/wire-tool-dispatcher';
import type {
  AssistantContext,
  AssistantToolResult,
} from '~/agent/tools/domain/assistant-tool';
import type { ToolCallRequest } from '~/agent/tools/domain/types/tool-call-request';
import type { ToolDispatchResult } from '~/agent/tools/domain/types/tool-dispatch-result';
import type { ToolDispatcher } from '~/agent/tools/infrastructure/tool-dispatcher';

type Listener<T extends unknown[]> = (...args: T) => void;

class FakeUpstream implements RealtimeUpstream {
  sent: Array<Buffer | string> = [];
  private messageListeners: Array<Listener<[Buffer | string]>> = [];

  send(data: Buffer | string): void {
    this.sent.push(data);
  }
  close(): void {
    /* no-op */
  }
  onMessage(fn: Listener<[Buffer | string]>): void {
    this.messageListeners.push(fn);
  }
  onClose(): void {
    /* no-op */
  }
  onError(): void {
    /* no-op */
  }
  onOpen(): void {
    /* no-op */
  }
  emitMessage(data: Buffer | string): void {
    for (const fn of this.messageListeners) fn(data);
  }
}

interface FakeClient {
  readyState: number;
  send: jest.Mock;
}

const makeClient = (): FakeClient => ({
  readyState: 1,
  send: jest.fn(),
});

const noopLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
} as unknown as Logger;

type DispatchImpl = (
  req: ToolCallRequest,
  ctx: AssistantContext,
) => Promise<ToolDispatchResult>;

interface FakeDispatcher {
  dispatch: jest.Mock<
    Promise<ToolDispatchResult>,
    [ToolCallRequest, AssistantContext]
  >;
  asPort: ToolDispatcher;
}

const makeDispatcher = (impl: DispatchImpl): FakeDispatcher => {
  const dispatch = jest.fn<
    Promise<ToolDispatchResult>,
    [ToolCallRequest, AssistantContext]
  >(impl);
  return { dispatch, asPort: { dispatch } as unknown as ToolDispatcher };
};

const flushMicrotasks = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

const clientPayloads = (client: FakeClient): Record<string, unknown>[] =>
  (client.send.mock.calls as Array<[unknown]>)
    .map(([payload]) => payload)
    .filter((p): p is string => typeof p === 'string')
    .map((p) => JSON.parse(p) as Record<string, unknown>);

const findClientEvent = (
  client: FakeClient,
  type: string,
): Record<string, unknown> | undefined =>
  clientPayloads(client).find((event) => event.type === type);

const upstreamPayloads = (upstream: FakeUpstream): Record<string, unknown>[] =>
  upstream.sent
    .filter((s): s is string => typeof s === 'string')
    .map((s) => JSON.parse(s) as Record<string, unknown>);

const okResult = (
  callId: string,
  data: unknown,
): AssistantToolResult & ToolDispatchResult => ({
  ok: true,
  callId,
  data,
});

describe('wireToolDispatcher', () => {
  it('em response.function_call_arguments.done: emite tool.pending, chama dispatcher, emite tool.result e devolve function_call_output + response.create upstream', async () => {
    const upstream = new FakeUpstream();
    const client = makeClient();
    const dispatcher = makeDispatcher(
      ({ toolName, callId, arguments: args }, ctx) =>
        Promise.resolve({
          ok: true,
          callId,
          data: { echoed: args, actor: ctx.userId, tool: toolName },
        }),
    );
    wireToolDispatcher({
      client: client as unknown as Parameters<
        typeof wireToolDispatcher
      >[0]['client'],
      upstream,
      dispatcher: dispatcher.asPort,
      userId: 'user-42',
      logger: noopLogger,
    });

    upstream.emitMessage(
      JSON.stringify({
        type: 'response.function_call_arguments.done',
        call_id: 'call_abc',
        name: 'set_nickname',
        arguments: JSON.stringify({ nickname: 'Felipe' }),
      }),
    );
    await flushMicrotasks();
    await flushMicrotasks();

    const pending = findClientEvent(client, 'tool.pending');
    expect(pending).toEqual({
      type: 'tool.pending',
      toolName: 'set_nickname',
      args: { nickname: 'Felipe' },
      callId: 'call_abc',
    });

    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      {
        toolName: 'set_nickname',
        callId: 'call_abc',
        arguments: { nickname: 'Felipe' },
      },
      expect.objectContaining({
        userId: 'user-42',
        requestId: expect.any(String) as unknown,
      }),
    );

    const result = findClientEvent(client, 'tool.result');
    expect(result).toEqual({
      type: 'tool.result',
      callId: 'call_abc',
      result: {
        echoed: { nickname: 'Felipe' },
        actor: 'user-42',
        tool: 'set_nickname',
      },
    });

    const sent = upstreamPayloads(upstream);
    const itemCreate = sent.find(
      (event) => event.type === 'conversation.item.create',
    );
    expect(itemCreate).toBeDefined();
    const item = itemCreate?.item as {
      type?: string;
      call_id?: string;
      output?: string;
    };
    expect(item.type).toBe('function_call_output');
    expect(item.call_id).toBe('call_abc');
    expect(JSON.parse(item.output ?? '{}')).toEqual({
      ok: true,
      data: {
        echoed: { nickname: 'Felipe' },
        actor: 'user-42',
        tool: 'set_nickname',
      },
    });
    expect(
      sent.find((event) => event.type === 'response.create'),
    ).toBeDefined();
  });

  it('em dispatcher ok=false: emite tool.error com a message e ainda envia function_call_output + response.create upstream', async () => {
    const upstream = new FakeUpstream();
    const client = makeClient();
    const dispatcher = makeDispatcher(({ callId }) =>
      Promise.resolve({
        ok: false,
        callId,
        error: { code: 'tool_error', message: 'nubank inexistente' } as never,
      }),
    );
    wireToolDispatcher({
      client: client as unknown as Parameters<
        typeof wireToolDispatcher
      >[0]['client'],
      upstream,
      dispatcher: dispatcher.asPort,
      userId: 'user-1',
      logger: noopLogger,
    });

    upstream.emitMessage(
      JSON.stringify({
        type: 'response.function_call_arguments.done',
        call_id: 'call_x',
        name: 'add_user_banks',
        arguments: JSON.stringify({ banks: ['nubankxpto'] }),
      }),
    );
    await flushMicrotasks();
    await flushMicrotasks();

    const errorEvent = findClientEvent(client, 'tool.error');
    expect(errorEvent).toEqual({
      type: 'tool.error',
      callId: 'call_x',
      message: 'nubank inexistente',
    });

    const sent = upstreamPayloads(upstream);
    const itemCreate = sent.find(
      (event) => event.type === 'conversation.item.create',
    );
    expect(itemCreate).toBeDefined();
    const parsed = JSON.parse(
      (itemCreate?.item as { output?: string }).output ?? '{}',
    ) as { ok: boolean };
    expect(parsed.ok).toBe(false);
    expect(
      sent.find((event) => event.type === 'response.create'),
    ).toBeDefined();
  });

  it('ignora evento com arguments malformado (não é JSON parseável)', async () => {
    const upstream = new FakeUpstream();
    const client = makeClient();
    const dispatcher = makeDispatcher(({ callId }) =>
      Promise.resolve(okResult(callId, {})),
    );
    wireToolDispatcher({
      client: client as unknown as Parameters<
        typeof wireToolDispatcher
      >[0]['client'],
      upstream,
      dispatcher: dispatcher.asPort,
      userId: 'u',
      logger: noopLogger,
    });

    upstream.emitMessage(
      JSON.stringify({
        type: 'response.function_call_arguments.done',
        call_id: 'call_1',
        name: 'foo',
        arguments: '{{{ not json',
      }),
    );
    await flushMicrotasks();

    expect(dispatcher.dispatch).not.toHaveBeenCalled();
    expect(client.send).not.toHaveBeenCalled();
  });

  it('ignora eventos de outros tipos', async () => {
    const upstream = new FakeUpstream();
    const client = makeClient();
    const dispatcher = makeDispatcher(({ callId }) =>
      Promise.resolve(okResult(callId, {})),
    );
    wireToolDispatcher({
      client: client as unknown as Parameters<
        typeof wireToolDispatcher
      >[0]['client'],
      upstream,
      dispatcher: dispatcher.asPort,
      userId: 'u',
      logger: noopLogger,
    });

    upstream.emitMessage(
      JSON.stringify({ type: 'response.output_text.done', text: 'oi' }),
    );
    await flushMicrotasks();

    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });
});
