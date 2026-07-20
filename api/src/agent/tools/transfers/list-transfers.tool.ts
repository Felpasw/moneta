import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { ListTransfersUseCase } from '../../../transfers/application/use-cases/list-transfers.use-case';
import { listTransfersSchema } from '../../../transfers/dto/list-transfers.dto';

@RegisterAssistantTool()
export class ListTransfersTool implements AssistantTool {
  readonly name = 'list_transfers';
  readonly description =
    'Lists the current user transfers with optional filters (date range, accounts). Paginated.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      dateFrom: { type: 'string', format: 'date-time' },
      dateTo: { type: 'string', format: 'date-time' },
      accountIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
      },
      limit: { type: 'integer', minimum: 1, maximum: 200 },
      offset: { type: 'integer', minimum: 0 },
    },
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna as transferências do user com filtros. Regras críticas: SEMPRE passe dateFrom e dateTo — NUNCA deixe aberto sem intervalo. Se o user não especificar, use o mês corrente (do dia 1 até hoje, timezone do user quando disponível). SEMPRE passe limit (default sensato 50, teto 200). accountIds filtra transferências em que uma das contas listadas aparece como origem OU destino. Read-only, seguro chamar sem confirmação. Retornado ordenado por data descendente.';

  constructor(private readonly listTransfers: ListTransfersUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = listTransfersSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    const results = await this.listTransfers.execute({
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: results };
  }
}
