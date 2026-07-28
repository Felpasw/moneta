import { Inject, Injectable, Optional } from '@nestjs/common';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { ReservedContextKey } from '../domain/constants/reserved-context-key';
import { ToolDispatchErrorCode } from '../domain/constants/tool-dispatch-error-code';
import type { ToolCallRequest } from '../domain/types/tool-call-request';
import type { ToolDispatchResult } from '../domain/types/tool-dispatch-result';
import type { ToolDispatcherOptions } from '../domain/types/tool-dispatcher-options';
import { TOOL_DISPATCHER_OPTIONS } from './constants/tool-dispatcher-options-token';
import { DEFAULT_TOOL_DISPATCHER_TIMEOUT_MS } from './constants/tool-dispatcher-timeout';
import { ToolTimeoutError } from './errors/tool-timeout.error';
import { ToolRegistry } from './tool-registry';
import { buildToolDispatchFailure } from './utils/build-tool-dispatch-failure';
import { extractErrorMessage } from './utils/extract-error-message';

const RESERVED_KEYS = Object.values(ReservedContextKey);

@Injectable()
export class ToolDispatcher {
  private readonly timeoutMs: number;

  constructor(
    private readonly registry: ToolRegistry,
    @Optional()
    @Inject(TOOL_DISPATCHER_OPTIONS)
    options?: ToolDispatcherOptions,
  ) {
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_TOOL_DISPATCHER_TIMEOUT_MS;
  }

  async dispatch(
    request: ToolCallRequest,
    ctx: AssistantContext,
  ): Promise<ToolDispatchResult> {
    const { toolName, callId } = request;

    const tool = this.registry.getByName(toolName);
    if (!tool) {
      return buildToolDispatchFailure({
        callId,
        code: ToolDispatchErrorCode.ToolNotFound,
        message: `Unknown tool "${toolName}"`,
      });
    }

    for (const key of RESERVED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(request.arguments, key)) {
        return buildToolDispatchFailure({
          callId,
          code: ToolDispatchErrorCode.InvalidInput,
          message: `Reserved context field "${key}" is not allowed in tool arguments`,
        });
      }
    }

    try {
      const outcome = await this.runWithTimeout(tool, request.arguments, ctx);
      if (!outcome.ok) {
        return buildToolDispatchFailure({
          callId,
          code: ToolDispatchErrorCode.ToolError,
          message: outcome.error ?? 'Tool reported failure',
        });
      }
      return {
        ok: true,
        callId,
        data: outcome.data,
        sideEffects: outcome.sideEffects,
      };
    } catch (err) {
      if (err instanceof ToolTimeoutError) {
        return buildToolDispatchFailure({
          callId,
          code: ToolDispatchErrorCode.Timeout,
          message: `Tool "${toolName}" execution exceeded ${this.timeoutMs}ms timeout`,
        });
      }
      return buildToolDispatchFailure({
        callId,
        code: ToolDispatchErrorCode.ToolError,
        message: extractErrorMessage(err),
      });
    }
  }

  private runWithTimeout(
    tool: AssistantTool,
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    return new Promise<AssistantToolResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ToolTimeoutError());
      }, this.timeoutMs);

      tool
        .execute(input, ctx)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err: unknown) => {
          clearTimeout(timer);
          if (err instanceof Error) {
            reject(err);
            return;
          }
          reject(new Error(extractErrorMessage(err)));
        });
    });
  }
}
