import { z } from 'zod';

import { AccountNotFoundError } from '../../accounts/domain/errors/account-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../../tools/domain/assistant-tool';
import { RegisterAssistantTool } from '../../tools/infrastructure/register-assistant-tool.decorator';
import { EditTransactionUseCase } from '../application/use-cases/edit-transaction.use-case';
import { TransactionNotFoundError } from '../domain/errors/transaction-not-found.error';
import { editTransactionSchema } from '../dto/edit-transaction.dto';

const inputSchema = editTransactionSchema.extend({ id: z.uuid() });

@RegisterAssistantTool()
export class EditTransactionTool implements AssistantTool {
  readonly name = 'edit_transaction';
  readonly description =
    'Edits fields of an existing transaction. Balance is automatically adjusted for the delta on the same account, or moved between accounts if accountId changes.';
  readonly jsonSchema = {
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
  };
  readonly playbook =
    'Edita campos de uma transação. Requer o id — nunca invente; se o user descrever a transação ("aquele ifood de ontem era 55 não 45"), busque por description + data antes se necessário e confirme o alvo. Passe apenas os campos que mudam — o resto fica intacto. Passe null explícito pra limpar categoryId ou description. Amount continua sempre positivo (type diferencia). Confirme com o user antes de invocar. Mudança de accountId revalida ownership da nova conta e ajusta saldos em ambas contas atomicamente.';

  constructor(private readonly editTransaction: EditTransactionUseCase) {}

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
      const transaction = await this.editTransaction.execute({
        ...parsed.data,
        userId: ctx.userId,
      });
      return { ok: true, data: transaction };
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
