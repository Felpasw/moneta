import type {
  AssistantTool,
  AssistantToolResult,
} from '../../domain/assistant-tool';
import { MetaToolName } from '../../domain/constants/meta-tool-name';
import type { GetToolHelpInput } from '../../domain/types/get-tool-help-input';
import type { ToolHelpResult } from '../../domain/types/tool-help-result';
import { GET_TOOL_HELP } from './constants/get-tool-help';

export class GetToolHelpMetaTool implements AssistantTool<GetToolHelpInput> {
  readonly name = MetaToolName.GetToolHelp;
  readonly description = GET_TOOL_HELP.description;
  readonly jsonSchema = GET_TOOL_HELP.jsonSchema;
  readonly playbook = GET_TOOL_HELP.playbook;

  constructor(
    private readonly resolveHelp: (toolName: string) => ToolHelpResult,
  ) {}

  execute(input: GetToolHelpInput): Promise<AssistantToolResult> {
    const result = this.resolveHelp(input.toolName);
    if (result.found) {
      return Promise.resolve({ ok: true, data: result.entry });
    }
    return Promise.resolve({ ok: true, data: result.error });
  }
}
