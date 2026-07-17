import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../../tools/domain/assistant-tool';
import { RegisterAssistantTool } from '../../tools/infrastructure/register-assistant-tool.decorator';
import { UpdateBankAccountUseCase } from '../application/use-cases/update-bank-account.use-case';
import { AccountNotFoundError } from '../domain/errors/account-not-found.error';
import { updateBankAccountSchema } from '../dto/update-bank-account.dto';

const inputSchema = updateBankAccountSchema.extend({ id: z.uuid() });

@RegisterAssistantTool()
export class UpdateBankAccountTool implements AssistantTool {
  readonly name = 'update_bank_account';
  readonly description =
    'Updates fields of an existing bank account owned by the current user. Balance cannot be updated here.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      nickname: { type: 'string', minLength: 1, maxLength: 80 },
      creditLimit: { type: ['number', 'null'], minimum: 0 },
      overdraftLimit: { type: ['number', 'null'], minimum: 0 },
      closeDay: { type: ['integer', 'null'], minimum: 1, maximum: 31 },
      dueDay: { type: ['integer', 'null'], minimum: 1, maximum: 31 },
    },
    required: ['id'],
    additionalProperties: false,
  };
  readonly playbook =
    'Atualiza campos de uma conta existente. Requer o id da conta (nunca invente — busque nas contas do user). Pode alterar nickname, creditLimit, closeDay, dueDay, overdraftLimit; passe null pra limpar campos opcionais. Balance NUNCA é alterado por aqui — pra ajustar saldo existe operação separada, oriente o user. Confirme mudanças com o user antes de invocar. Se a conta não existir ou não pertencer ao user, retorna erro.';

  constructor(private readonly updateBankAccount: UpdateBankAccountUseCase) {}

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
      const account = await this.updateBankAccount.execute({
        ...parsed.data,
        userId: ctx.userId,
      });
      return { ok: true, data: account };
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
