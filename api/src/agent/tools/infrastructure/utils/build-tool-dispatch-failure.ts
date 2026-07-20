import type { ToolDispatchErrorCode } from '../../domain/constants/tool-dispatch-error-code';
import type { ToolDispatchResult } from '../../domain/types/tool-dispatch-result';

export const buildToolDispatchFailure = (params: {
  callId: string;
  code: ToolDispatchErrorCode;
  message: string;
}): ToolDispatchResult => ({
  ok: false,
  callId: params.callId,
  error: { code: params.code, message: params.message },
});
