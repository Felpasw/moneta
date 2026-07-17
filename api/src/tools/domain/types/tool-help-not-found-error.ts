import type { ToolHelpErrorCode } from '../constants/tool-help-error-code';

export interface ToolHelpNotFoundError {
  readonly error: ToolHelpErrorCode;
  readonly toolName: string;
}
