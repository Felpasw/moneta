import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { ListTransactionsUseCase } from '../../../finance/transactions/application/use-cases/list-transactions.use-case';
import { listTransactionsSchema } from '../../../finance/transactions/dto/list-transactions.dto';

@RegisterAssistantTool()
export class ListTransactionsTool implements AssistantTool {
  readonly name = 'list_transactions';
  readonly description =
    'Lists the current user transactions with optional filters (date range, accounts, categories, types, text search). Paginated.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      dateFrom: { type: 'string', format: 'date-time' },
      dateTo: { type: 'string', format: 'date-time' },
      accountIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
      },
      categoryIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
      },
      types: {
        type: 'array',
        items: { type: 'string', enum: ['expense', 'income'] },
      },
      textSearch: { type: 'string', maxLength: 255 },
      limit: { type: 'integer', minimum: 1, maximum: 200 },
      offset: { type: 'integer', minimum: 0 },
    },
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna as transações do user com filtros. Regras críticas: SEMPRE passe dateFrom e dateTo — NUNCA deixe aberto sem intervalo. Se o user não especificar, use o mês corrente (do dia 1 até hoje, timezone do user quando disponível). SEMPRE passe limit (default sensato 50, teto 200) — evita retornar dezenas de milhares de linhas pro contexto do LLM. Filtros opcionais accountIds/categoryIds/types aceitam arrays. Read-only, seguro chamar sem confirmação. Retornado ordenado por data descendente.';

  constructor(private readonly listTransactions: ListTransactionsUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = listTransactionsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    const results = await this.listTransactions.execute({
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: results };
  }
}
