import { DiscoveryModule } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '~/tools/domain/assistant-tool';
import { TOOL_DISPATCHER_OPTIONS } from '~/tools/infrastructure/constants/tool-dispatcher-options-token';
import { RegisterAssistantTool } from '~/tools/infrastructure/register-assistant-tool.decorator';
import { ToolDispatcher } from '~/tools/infrastructure/tool-dispatcher';
import { ToolRegistry } from '~/tools/infrastructure/tool-registry';

const ctx: AssistantContext = {
  userId: 'user-1',
  requestId: 'req-1',
  conversationId: 'conv-1',
};

@RegisterAssistantTool()
class EchoTool implements AssistantTool<{ text: string }> {
  readonly name = 'echo';
  readonly description = 'echo';
  readonly jsonSchema = { type: 'object', properties: {} };
  readonly playbook = 'p';
  execute = jest.fn(
    (
      input: { text: string },
      ctxArg: AssistantContext,
    ): Promise<AssistantToolResult> =>
      Promise.resolve({
        ok: true,
        data: { text: input.text, actor: ctxArg.userId },
      }),
  );
}

@RegisterAssistantTool()
class ThrowingTool implements AssistantTool {
  readonly name = 'boom';
  readonly description = 'boom';
  readonly jsonSchema = {};
  readonly playbook = 'p';
  execute(): Promise<AssistantToolResult> {
    return Promise.reject(new Error('kaboom'));
  }
}

@RegisterAssistantTool()
class SlowTool implements AssistantTool {
  readonly name = 'slow';
  readonly description = 'slow';
  readonly jsonSchema = {};
  readonly playbook = 'p';
  async execute(): Promise<AssistantToolResult> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { ok: true };
  }
}

@RegisterAssistantTool()
class FailingTool implements AssistantTool {
  readonly name = 'fail';
  readonly description = 'fail';
  readonly jsonSchema = {};
  readonly playbook = 'p';
  execute(): Promise<AssistantToolResult> {
    return Promise.resolve({ ok: false, error: 'nope' });
  }
}

const buildModule = async (
  providers: unknown[],
  timeoutMs = 100,
): Promise<TestingModule> => {
  const module = await Test.createTestingModule({
    imports: [DiscoveryModule],
    providers: [
      ToolRegistry,
      ToolDispatcher,
      { provide: TOOL_DISPATCHER_OPTIONS, useValue: { timeoutMs } },
      ...(providers as never[]),
    ],
  }).compile();
  await module.init();
  return module;
};

describe('ToolDispatcher', () => {
  it('resolves the tool, executes with the session context, returns structured ok', async () => {
    const module = await buildModule([EchoTool]);
    const dispatcher = module.get(ToolDispatcher);

    const result = await dispatcher.dispatch(
      { toolName: 'echo', callId: 'c1', arguments: { text: 'hi' } },
      ctx,
    );

    expect(result).toEqual({
      ok: true,
      callId: 'c1',
      data: { text: 'hi', actor: 'user-1' },
    });
  });

  it('returns tool_not_found for unknown tool', async () => {
    const module = await buildModule([EchoTool]);
    const dispatcher = module.get(ToolDispatcher);

    const result = await dispatcher.dispatch(
      { toolName: 'ghost', callId: 'c2', arguments: {} },
      ctx,
    );

    expect(result).toEqual({
      ok: false,
      callId: 'c2',
      error: {
        code: 'tool_not_found',
        message: expect.stringContaining('ghost') as unknown,
      },
    });
  });

  it('wraps a tool exception into tool_error', async () => {
    const module = await buildModule([ThrowingTool]);
    const dispatcher = module.get(ToolDispatcher);

    const result = await dispatcher.dispatch(
      { toolName: 'boom', callId: 'c3', arguments: {} },
      ctx,
    );

    expect(result).toEqual({
      ok: false,
      callId: 'c3',
      error: { code: 'tool_error', message: 'kaboom' },
    });
  });

  it('propagates a tool result with ok=false as tool_error', async () => {
    const module = await buildModule([FailingTool]);
    const dispatcher = module.get(ToolDispatcher);

    const result = await dispatcher.dispatch(
      { toolName: 'fail', callId: 'c4', arguments: {} },
      ctx,
    );

    expect(result).toEqual({
      ok: false,
      callId: 'c4',
      error: { code: 'tool_error', message: 'nope' },
    });
  });

  it('returns timeout when execution exceeds the configured budget', async () => {
    const module = await buildModule([SlowTool], 20);
    const dispatcher = module.get(ToolDispatcher);

    const result = await dispatcher.dispatch(
      { toolName: 'slow', callId: 'c5', arguments: {} },
      ctx,
    );

    expect(result).toEqual({
      ok: false,
      callId: 'c5',
      error: {
        code: 'timeout',
        message: expect.stringMatching(/timeout/i) as unknown,
      },
    });
  });

  it('rejects a payload that attempts to inject userId (MNT-54)', async () => {
    const module = await buildModule([EchoTool]);
    const dispatcher = module.get(ToolDispatcher);

    const result = await dispatcher.dispatch(
      { toolName: 'echo', callId: 'c6', arguments: { userId: 'attacker' } },
      ctx,
    );

    expect(result).toEqual({
      ok: false,
      callId: 'c6',
      error: {
        code: 'invalid_input',
        message: expect.stringContaining('userId') as unknown,
      },
    });
  });

  it('rejects a payload that attempts to inject requestId or conversationId (MNT-54)', async () => {
    const module = await buildModule([EchoTool]);
    const dispatcher = module.get(ToolDispatcher);

    for (const key of ['requestId', 'conversationId']) {
      const result = await dispatcher.dispatch(
        { toolName: 'echo', callId: 'c7', arguments: { [key]: 'evil' } },
        ctx,
      );
      expect(result).toEqual({
        ok: false,
        callId: 'c7',
        error: {
          code: 'invalid_input',
          message: expect.stringContaining(key) as unknown,
        },
      });
    }
  });

  it('never leaks arguments-supplied fields into ctx passed to the tool (MNT-54)', async () => {
    const module = await buildModule([EchoTool]);
    const dispatcher = module.get(ToolDispatcher);
    const echo = module.get(EchoTool);

    await dispatcher.dispatch(
      { toolName: 'echo', callId: 'c8', arguments: { text: 'ok' } },
      ctx,
    );

    expect(echo.execute).toHaveBeenCalledWith({ text: 'ok' }, ctx);
  });
});
