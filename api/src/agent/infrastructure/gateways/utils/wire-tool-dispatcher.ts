import { randomUUID } from 'node:crypto';

import type { WebSocket } from 'ws';

import type { RealtimeUpstream } from '~/agent/domain/ports/realtime-upstream';
import type { ToolDispatchResult } from '~/agent/tools/domain/types/tool-dispatch-result';
import type { ToolSideEffect } from '~/agent/tools/domain/types/tool-side-effect';

import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';
import { SYSTEM_EVENT_TYPE } from '../constants/system-event-types';
import { TOOL_EVENT_TYPE } from '../constants/tool-event-types';
import type { ParsedToolCall } from '../types/parsed-tool-call';
import type { RealtimeFunctionCallEvent } from '../types/realtime-function-call-event';
import type { ToolDispatcherContext } from '../types/tool-dispatcher-context';
import { parseRealtimeEvent } from './parse-realtime-event';
import { sendClientEvent } from './send-client-event';

const SIDE_EFFECT_EMITTERS: Record<
  ToolSideEffect['kind'],
  (client: WebSocket, effect: ToolSideEffect) => void
> = {
  redirect: (client, effect) => {
    sendClientEvent(client, {
      type: SYSTEM_EVENT_TYPE.redirect,
      target: effect.target,
    });
  },
};

const emitSideEffects = (
  client: WebSocket,
  sideEffects: readonly ToolSideEffect[] | undefined,
): void => {
  if (!sideEffects) return;
  for (const effect of sideEffects) {
    SIDE_EFFECT_EMITTERS[effect.kind](client, effect);
  }
};

const sendFunctionCallOutput = (
  upstream: RealtimeUpstream,
  callId: string,
  output: unknown,
): void => {
  upstream.send(
    JSON.stringify({
      type: REALTIME_EVENT_TYPE.conversationItemCreate,
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(output),
      },
    }),
  );
  upstream.send(JSON.stringify({ type: REALTIME_EVENT_TYPE.responseCreate }));
};

const handleResult = (
  ctx: ToolDispatcherContext,
  result: ToolDispatchResult,
): void => {
  if (result.ok) {
    sendClientEvent(ctx.client, {
      type: TOOL_EVENT_TYPE.result,
      callId: result.callId,
      result: result.data,
    });
    emitSideEffects(ctx.client, result.sideEffects);
    sendFunctionCallOutput(ctx.upstream, result.callId, {
      ok: true,
      data: result.data,
    });
    return;
  }
  const message = result.error?.message ?? 'tool dispatch failed';
  sendClientEvent(ctx.client, {
    type: TOOL_EVENT_TYPE.error,
    callId: result.callId,
    message,
  });
  sendFunctionCallOutput(ctx.upstream, result.callId, {
    ok: false,
    error: result.error,
  });
};

const handleToolCall = async (
  ctx: ToolDispatcherContext,
  event: RealtimeFunctionCallEvent,
): Promise<void> => {
  try {
    const call: ParsedToolCall = {
      toolName: event.name,
      callId: event.call_id,
      args: JSON.parse(event.arguments) as Record<string, unknown>,
    };
    sendClientEvent(ctx.client, {
      type: TOOL_EVENT_TYPE.pending,
      toolName: call.toolName,
      args: call.args,
      callId: call.callId,
    });
    const result = await ctx.dispatcher.dispatch(
      {
        toolName: call.toolName,
        callId: call.callId,
        arguments: call.args,
      },
      { userId: ctx.userId, requestId: randomUUID() },
    );
    handleResult(ctx, result);
  } catch (err) {
    ctx.logger.error(
      `tool dispatch crashed for ${event.name}: ${(err as Error).message}`,
    );
  }
};

export const wireToolDispatcher = (ctx: ToolDispatcherContext): void => {
  ctx.upstream.onMessage((data) => {
    const event = parseRealtimeEvent(data);
    if (!event) return;
    if (event.type !== REALTIME_EVENT_TYPE.responseFunctionCallArgumentsDone) {
      return;
    }
    void handleToolCall(ctx, event as unknown as RealtimeFunctionCallEvent);
  });
};
