import { z } from 'zod';

import { AccountNotFoundError } from '../../accounts/domain/errors/account-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../../tools/domain/assistant-tool';
import { RegisterAssistantTool } from '../../tools/infrastructure/register-assistant-tool.decorator';
import { EditManyTransactionsUseCase } from '../application/use-cases/edit-many-transactions.use-case';
import { TransactionNotFoundError } from '../domain/errors/transaction-not-found.error';
import { editTransactionSchema } from '../dto/edit-transaction.dto';

const itemSchema = editTransactionSchema.extend({ id: z.uuid() });

const inputSchema = z.object({
  edits: z.array(itemSchema).min(1).max(50),
});

@RegisterAssistantTool()
export class EditTransactionsTool implements AssistantTool {
  readonly name = 'edit_transactions';
  readonly description =
    'Edits multiple transactions in a single atomic batch. Use for bulk corrections (e.g. recategorizing several expenses at once).';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      edits: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            accountId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['expense', 'income'] },
            amount: { type: 'number', exclusiveMinimum: 0 },
            categoryId: { type: ['string', 'null'], format: 'uuid' },
            description: { type: ['string', 'null'], maxLength: 255 },
            occurredAt: { type: 'string', format: 'date-time' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
    },
    required: ['edits'],
    additionalProperties: false,
  };
  readonly playbook =
    'Edita várias transações de uma vez, atomicamente — ou TODAS aplicam ou NENHUMA muda. Use pra correções em lote (ex: reclassificar 5 gastos "outros" pra "alimentação"). Cada item precisa do id da transação alvo + apenas os campos que mudam. Confirme com o user o resumo do que vai mudar antes de invocar. Máximo 50 itens por batch. Se qualquer item falhar (não encontrado ou nova conta inválida), o batch inteiro é revertido — nenhum saldo é alterado.';

  constructor(private readonly editMany: EditManyTransactionsUseCase) {}

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
      const results = await this.editMany.execute(
        parsed.data.edits.map((e) => ({ ...e, userId: ctx.userId })),
      );
      return { ok: true, data: results };
    } catch (e) {
      if (
        e instanceof TransactionNotFoundError ||
        e instanceof AccountNotFoundError
      ) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
