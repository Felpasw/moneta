export interface ToolCallRequest {
  readonly toolName: string;
  readonly callId: string;
  readonly arguments: Record<string, unknown>;
}
