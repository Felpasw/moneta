export interface AssistantContext {
  readonly userId: string;
  readonly requestId: string;
  readonly conversationId?: string;
}

export interface AssistantToolResult {
  readonly ok: boolean;
  readonly data?: unknown;
  readonly error?: string;
}

export interface AssistantTool<TInput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly jsonSchema: Record<string, unknown>;
  readonly playbook: string;
  readonly preloadPlaybook?: boolean;
  execute(input: TInput, ctx: AssistantContext): Promise<AssistantToolResult>;
}
