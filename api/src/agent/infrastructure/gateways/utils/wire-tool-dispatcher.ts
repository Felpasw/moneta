import { randomUUID } from 'node:crypto';

import type { WebSocket } from 'ws';

import type { RealtimeUpstream } from '~/agent/domain/ports/realtime-upstream';
import type { ToolDispatchResult } from '~/agent/tools/domain/types/tool-dispatch-result';
import type { ToolSideEffect } from '~/agent/tools/domain/types/tool-side-effect';

import { AgentSocketEvent } from '../constants/agent-socket-events';
import { REALTIME_EVENT_TYPE } from '../constants/realtime-event-types';
import type { ParsedToolCall } from '../types/parsed-tool-call';
import type { RealtimeFunctionCallEvent } from '../types/realtime-function-call-event';
import type { ToolDispatcherContext } from '../types/tool-dispatcher-context';
import { parseRealtimeEvent } from './parse-realtime-event';
import { sendClientEvent } from './send-client-event';
import { resolveToolCaption } from './tool-captions';
import { resolveToolResources } from './tool-resources';

const SIDE_EFFECT_EMITTERS: Record<
  ToolSideEffect['kind'],
  (client: WebSocket, effect: ToolSideEffect) => void
> = {
  redirect: (client, effect) => {
    sendClientEvent(client, {
      type: AgentSocketEvent.SystemRedirect,
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
  toolName: string,
  pendingResources: Set<string>,
): void => {
  if (result.ok) {
    sendClientEvent(ctx.client, {
      type: AgentSocketEvent.ToolResult,
      callId: result.callId,
      result: result.data,
    });
    emitSideEffects(ctx.client, result.sideEffects);
    sendFunctionCallOutput(ctx.upstream, result.callId, {
      ok: true,
      data: result.data,
    });
    const resources = resolveToolResources(toolName);
    if (resources) for (const r of resources) pendingResources.add(r);
    return;
  }
  const message = result.error?.message ?? 'tool dispatch failed';
  sendClientEvent(ctx.client, {
    type: AgentSocketEvent.ToolError,
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
  pendingResources: Set<string>,
): Promise<void> => {
  try {
    const call: ParsedToolCall = {
      toolName: event.name,
      callId: event.call_id,
      args: JSON.parse(event.arguments) as Record<string, unknown>,
    };
    const caption = resolveToolCaption(call.toolName, call.args);
    sendClientEvent(ctx.client, {
      type: AgentSocketEvent.ToolPending,
      toolName: call.toolName,
      args: call.args,
      callId: call.callId,
      ...(caption !== undefined ? { caption } : {}),
    });
    const result = await ctx.dispatcher.dispatch(
      {
        toolName: call.toolName,
        callId: call.callId,
        arguments: call.args,
      },
      { userId: ctx.userId, requestId: randomUUID() },
    );
    handleResult(ctx, result, call.toolName, pendingResources);
  } catch (err) {
    ctx.logger.error(
      `tool dispatch crashed for ${event.name}: ${(err as Error).message}`,
    );
  }
};

const flushInvalidate = (
  ctx: ToolDispatcherContext,
  pendingResources: Set<string>,
): void => {
  if (pendingResources.size === 0) return;
  sendClientEvent(ctx.client, {
    type: AgentSocketEvent.StateInvalidate,
    resources: [...pendingResources],
  });
  pendingResources.clear();
};

export const wireToolDispatcher = (ctx: ToolDispatcherContext): void => {
  const pendingResources = new Set<string>();
  ctx.upstream.onMessage((data) => {
    const event = parseRealtimeEvent(data);
    if (!event) return;
    if (event.type === REALTIME_EVENT_TYPE.responseFunctionCallArgumentsDone) {
      void handleToolCall(
        ctx,
        event as unknown as RealtimeFunctionCallEvent,
        pendingResources,
      );
      return;
    }
    if (event.type === REALTIME_EVENT_TYPE.responseDone) {
      flushInvalidate(ctx, pendingResources);
    }
  });
};
