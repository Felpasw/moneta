import type { ToolHelpEntry } from './tool-help-entry';
import type { ToolHelpNotFoundError } from './tool-help-not-found-error';

export interface ToolHelpResult {
  readonly found: boolean;
  readonly entry?: ToolHelpEntry;
  readonly error?: ToolHelpNotFoundError;
}
