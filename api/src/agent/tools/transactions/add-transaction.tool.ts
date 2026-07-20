import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { AddTransactionUseCase } from '../../../transactions/application/use-cases/add-transaction.use-case';
import { addTransactionSchema } from '../../../transactions/dto/add-transaction.dto';

@RegisterAssistantTool()
export class AddTransactionTool implements AssistantTool {
  readonly name = 'add_transaction';
  readonly description =
    'Registers a single transaction (expense or income) on one of the user accounts. Amount is always positive; the type field distinguishes expense from income.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      accountId: { type: 'string', format: 'uuid' },
      type: { type: 'string', enum: ['expense', 'income'] },
      amount: { type: 'number', exclusiveMinimum: 0 },
      categoryId: { type: 'string', format: 'uuid' },
      description: { type: 'string', maxLength: 255 },
      occurredAt: { type: 'string', format: 'date-time' },
    },
    required: ['accountId', 'type', 'amount', 'occurredAt'],
    additionalProperties: false,
  };
  readonly playbook =
    'Registra uma transação (gasto ou receita). Regras críticas: amount SEMPRE positivo — quem indica entrada ou saída é o campo type (expense ou income). Nunca invente data (occurredAt) — pergunte ao user. Confirme antes de invocar: conta, tipo, valor, descrição, data. Sugira categoria mas confirme — a categoria precisa existir nas visíveis do user. Se a conta for cartão de crédito, avise que a transação entra na próxima fatura. Se a conta não pertencer ao user, retorna erro.';

  constructor(private readonly addTransaction: AddTransactionUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = addTransactionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    try {
      const transaction = await this.addTransaction.execute({
        userId: ctx.userId,
        ...parsed.data,
      });
      return { ok: true, data: transaction };
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
