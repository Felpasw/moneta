import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../../tools/domain/assistant-tool';
import { RegisterAssistantTool } from '../../tools/infrastructure/register-assistant-tool.decorator';
import { DeleteBankAccountUseCase } from '../application/use-cases/delete-bank-account.use-case';
import { AccountNotFoundError } from '../domain/errors/account-not-found.error';

const inputSchema = z.object({ id: z.uuid() });

@RegisterAssistantTool()
export class DeleteBankAccountTool implements AssistantTool {
  readonly name = 'delete_bank_account';
  readonly description =
    'Deletes a bank account owned by the current user. Fails if the account still has linked transactions.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
    required: ['id'],
    additionalProperties: false,
  };
  readonly playbook =
    'Deleta uma conta bancária. Confirme o nickname da conta com o user antes de invocar — deletar é irreversível. Se a conta tiver transações registradas, o banco de dados rejeita a operação; nesse caso oriente o user a arquivar como alternativa (renomear pra Arquivada - Nome Antigo). Requer apenas o id.';

  constructor(private readonly deleteBankAccount: DeleteBankAccountUseCase) {}

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
      await this.deleteBankAccount.execute({
        id: parsed.data.id,
        userId: ctx.userId,
      });
      return { ok: true, data: { id: parsed.data.id, deleted: true } };
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
