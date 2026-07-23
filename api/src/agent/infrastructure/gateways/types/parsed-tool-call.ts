export interface ParsedToolCall {
  readonly toolName: string;
  readonly callId: string;
  readonly args: Record<string, unknown>;
}
