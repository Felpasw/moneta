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
    'Lists the current user transactions (items with account + category embedded and signedAmount) plus a summary (totalIncome, totalExpense, net) aggregated over the filtered set. Paginated.';
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
    'Retorna `{ items, summary }`. `items` = transações filtradas, cada uma com: type, amount, `signedAmount` (expense negativo, income positivo — sem precisar recalcular), description, occurredAt, `account: { id, nickname, bankName }` e `category: { id, name, icon, color } | null`. `summary` agrega SÓ o conjunto filtrado: `totalIncome` = soma dos income, `totalExpense` = soma dos expense, `net = totalIncome - totalExpense`. Regras críticas: SEMPRE passe dateFrom e dateTo — NUNCA deixe aberto sem intervalo. Se o user não especificar, use o mês corrente (do dia 1 até hoje, timezone do user quando disponível). SEMPRE passe limit (default sensato 50, teto 200) — evita retornar dezenas de milhares de linhas pro contexto do LLM. Filtros opcionais accountIds/categoryIds/types aceitam arrays. Use `summary.net` pra responder "quanto sobrou nesse mês", `summary.totalExpense` pra "quanto gastei" — sem somar do lado do agent. Read-only, seguro chamar sem confirmação. Retornado ordenado por data descendente.';

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
