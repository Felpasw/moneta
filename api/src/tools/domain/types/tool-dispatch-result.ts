import type { ToolDispatchError } from './tool-dispatch-error';

export interface ToolDispatchResult {
  readonly ok: boolean;
  readonly callId: string;
  readonly data?: unknown;
  readonly error?: ToolDispatchError;
}
