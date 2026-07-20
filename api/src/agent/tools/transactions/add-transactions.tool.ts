import { z } from 'zod';

import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { AddManyTransactionsUseCase } from '../../../finance/transactions/application/use-cases/add-many-transactions.use-case';
import { addTransactionSchema } from '../../../finance/transactions/dto/add-transaction.dto';

const inputSchema = z.object({
  transactions: z.array(addTransactionSchema).min(1).max(50),
});

@RegisterAssistantTool()
export class AddTransactionsTool implements AssistantTool {
  readonly name = 'add_transactions';
  readonly description =
    'Registers multiple transactions in a single atomic batch. Either all succeed or none is persisted. Use when the user reports several expenses or incomes in the same turn.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      transactions: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
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
        },
      },
    },
    required: ['transactions'],
    additionalProperties: false,
  };
  readonly playbook =
    'Registra várias transações de uma vez, atomicamente — ou TODAS entram ou NENHUMA. Use quando o user reporta múltiplos gastos ou receitas no mesmo turno (ex: "semana passada gastei 10 no café, 25 no uber, 150 no mercado"). Cada item tem os mesmos campos que a versão single (amount positivo, type diferencia expense/income, occurredAt obrigatório). Confirme com o user TODOS os itens antes — mostre um resumo. Máximo 50 itens por batch. Se qualquer item tiver conta inválida ou dado ruim, o batch inteiro é revertido — nenhum saldo é alterado. Ordem de recebimento é preservada no retorno.';

  constructor(private readonly addMany: AddManyTransactionsUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    try {
      const results = await this.addMany.execute(
        parsed.data.transactions.map((t) => ({ userId: ctx.userId, ...t })),
      );
      return { ok: true, data: results };
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
