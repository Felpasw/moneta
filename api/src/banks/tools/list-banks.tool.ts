import type {
  AssistantTool,
  AssistantToolResult,
} from '../../tools/domain/assistant-tool';
import { RegisterAssistantTool } from '../../tools/infrastructure/register-assistant-tool.decorator';
import { ListBanksUseCase } from '../application/use-cases/list-banks.use-case';

@RegisterAssistantTool()
export class ListBanksTool implements AssistantTool {
  readonly name = 'list_banks';
  readonly description =
    'Returns the global catalog of supported Brazilian banks (name and COMPE code). No input required.';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna o catálogo global de bancos suportados (nome + código COMPE). Sem input. Use quando o user pergunta que bancos existem, ou quando precisar do bankId de um banco específico antes de criar uma conta. Read-only, seguro chamar sem confirmação.';

  constructor(private readonly listBanks: ListBanksUseCase) {}

  async execute(): Promise<AssistantToolResult> {
    const banks = await this.listBanks.execute();
    return { ok: true, data: banks };
  }
}
