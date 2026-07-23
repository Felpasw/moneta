import { z } from 'zod';

import { SetAccountBalancesUseCase } from '../../../finance/accounts/application/use-cases/set-account-balances.use-case';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({
  balances: z
    .array(
      z.object({
        accountId: z.uuid(),
        balance: z.number().nonnegative(),
      }),
    )
    .min(1)
    .refine(
      (items) => new Set(items.map((i) => i.accountId)).size === items.length,
      {
        message:
          'accountIds duplicados no batch — resolva a correção antes de chamar',
      },
    ),
});

@RegisterAssistantTool()
export class SetAccountBalancesTool implements AssistantTool {
  readonly name = 'set_account_balances';
  readonly description =
    'Atualiza o saldo de várias contas do user em um batch único. Recebe pares { accountId, balance }; não aceita balance negativo nem accountId duplicado.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      balances: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            accountId: { type: 'string', format: 'uuid' },
            balance: { type: 'number', minimum: 0 },
          },
          required: ['accountId', 'balance'],
          additionalProperties: false,
        },
        minItems: 1,
      },
    },
    required: ['balances'],
    additionalProperties: false,
  };
  readonly playbook =
    'Chame depois que o user disser TODOS os saldos numa única fala. Use SEMPRE os accountId que vieram do onboarding anterior (você tem no contexto da conversa); nunca invente. Se o user corrigir um valor no meio da fala (ex: "3 mil, ah não, 5 mil no Nubank"), resolva a correção ANTES de chamar — nunca mande dois balances pro mesmo accountId no batch, o backend rejeita. Balance é o saldo real da conta, sempre >= 0 (dívida de cartão vem em outro fluxo). Se algum accountId cair em notFound, avise inconsistência. Se updated vazio, não avance pra fechar o onboarding.';

  constructor(private readonly useCase: SetAccountBalancesUseCase) {}

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
    const result = await this.useCase.execute({
      userId: ctx.userId,
      balances: parsed.data.balances,
    });
    return { ok: true, data: result };
  }
}
