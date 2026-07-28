import type { ToolDispatchError } from './tool-dispatch-error';
import type { ToolSideEffect } from './tool-side-effect';

export interface ToolDispatchResult {
  readonly ok: boolean;
  readonly callId: string;
  readonly data?: unknown;
  readonly error?: ToolDispatchError;
  readonly sideEffects?: readonly ToolSideEffect[];
}
