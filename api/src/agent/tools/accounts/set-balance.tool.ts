import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { SetBalanceUseCase } from '../../../finance/accounts/application/use-cases/set-balance.use-case';
import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';

const inputSchema = z.object({
  accountId: z.uuid(),
  amount: z.number(),
});

@RegisterAssistantTool()
export class SetBalanceTool implements AssistantTool {
  readonly name = 'set_balance';
  readonly description =
    'Overwrites the balance of an account with the given amount. Does not create a compensating transaction.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      accountId: { type: 'string', format: 'uuid' },
      amount: { type: 'number' },
    },
    required: ['accountId', 'amount'],
    additionalProperties: false,
  };
  readonly playbook =
    'Sobrescreve o balance atual de uma conta pelo valor informado. É um ajuste bruto — não cria transação de compensação; o sistema começa a rastrear a partir desse valor. Use quando o user diz meu saldo real é X ou quer resetar a base. Confirme o valor exato antes; balance errado corrompe todos os relatórios. Aceita valores negativos (cheque especial, dívida). Após rodar, confirme o valor salvo pro user.';

  constructor(private readonly setBalance: SetBalanceUseCase) {}

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
      const account = await this.setBalance.execute({
        id: parsed.data.accountId,
        userId: ctx.userId,
        amount: parsed.data.amount,
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
