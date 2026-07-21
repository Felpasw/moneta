import type { ToolDispatchErrorCode } from '../constants/tool-dispatch-error-code';

export interface ToolDispatchError {
  readonly code: ToolDispatchErrorCode;
  readonly message: string;
}
