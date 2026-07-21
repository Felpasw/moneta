import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { DeleteTransactionUseCase } from '../../../finance/transactions/application/use-cases/delete-transaction.use-case';
import { TransactionNotFoundError } from '../../../finance/transactions/domain/errors/transaction-not-found.error';

const inputSchema = z.object({ id: z.uuid() });

@RegisterAssistantTool()
export class DeleteTransactionTool implements AssistantTool {
  readonly name = 'delete_transaction';
  readonly description =
    'Deletes a transaction and reverses its effect on the account balance atomically.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
    required: ['id'],
    additionalProperties: false,
  };
  readonly playbook =
    'Remove uma transação. O saldo da conta é ajustado automaticamente pra reverter o efeito original (income deletado subtrai saldo; expense deletado credita). Confirme com o user antes de invocar — é irreversível. Requer só o id.';

  constructor(private readonly deleteTransaction: DeleteTransactionUseCase) {}

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
      await this.deleteTransaction.execute({
        id: parsed.data.id,
        userId: ctx.userId,
      });
      return { ok: true, data: { id: parsed.data.id, deleted: true } };
    } catch (e) {
      if (e instanceof TransactionNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
