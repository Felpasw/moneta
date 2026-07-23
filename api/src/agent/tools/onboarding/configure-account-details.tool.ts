import { z } from 'zod';

import { ConfigureAccountDetailsUseCase } from '../../../finance/accounts/application/use-cases/configure-account-details.use-case';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const accountSchema = z
  .object({
    accountId: z.uuid(),
    creditLimit: z.number().nonnegative().optional(),
    closeDay: z.number().int().min(1).max(31).optional(),
    dueDay: z.number().int().min(1).max(31).optional(),
    overdraftLimit: z.number().nonnegative().optional(),
  })
  .refine(
    (patch) => {
      const creditFields = [patch.creditLimit, patch.closeDay, patch.dueDay];
      const present = creditFields.filter((v) => v !== undefined).length;
      return present === 0 || present === 3;
    },
    {
      message:
        'campos de crédito (creditLimit, closeDay, dueDay) devem vir os 3 juntos ou nenhum',
    },
  )
  .refine(
    (patch) =>
      patch.creditLimit !== undefined ||
      patch.closeDay !== undefined ||
      patch.dueDay !== undefined ||
      patch.overdraftLimit !== undefined,
    { message: 'account deve ter pelo menos um campo a atualizar' },
  );

const inputSchema = z.object({
  accounts: z
    .array(accountSchema)
    .min(1)
    .refine(
      (items) => new Set(items.map((i) => i.accountId)).size === items.length,
      {
        message:
          'accountIds duplicados no batch — envie um patch único por conta',
      },
    ),
});

@RegisterAssistantTool()
export class ConfigureAccountDetailsTool implements AssistantTool {
  readonly name = 'configure_account_details';
  readonly description =
    'Ajusta detalhes de crédito (creditLimit + closeDay + dueDay) e/ou cheque especial (overdraftLimit) em contas existentes do user. Aceita batch com combinações diferentes por conta.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      accounts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            accountId: { type: 'string', format: 'uuid' },
            creditLimit: { type: 'number', minimum: 0 },
            closeDay: { type: 'integer', minimum: 1, maximum: 31 },
            dueDay: { type: 'integer', minimum: 1, maximum: 31 },
            overdraftLimit: { type: 'number', minimum: 0 },
          },
          required: ['accountId'],
          additionalProperties: false,
        },
        minItems: 1,
      },
    },
    required: ['accounts'],
    additionalProperties: false,
  };
  readonly playbook =
    'Chame no onboarding depois dos saldos. Pergunta banco por banco: 1) tem cartão de crédito? Se sim, colhe limite + dia de fechamento (1..31) + dia de vencimento (1..31) — os 3 vêm SEMPRE juntos, cartão sem esses campos não existe. 2) tem cheque especial (overdraft)? Se sim, colhe o limite. Use SEMPRE accountId do contexto da conversa; nunca invente. Se user disser não pra tudo dos bancos, pula sem chamar (essa tool é opcional pro onboarding). Nunca envie 2 patches pro mesmo accountId no batch — junte tudo dele numa entrada só. Se algum accountId cair em notFound, avise inconsistência.';

  constructor(private readonly useCase: ConfigureAccountDetailsUseCase) {}

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
      accounts: parsed.data.accounts,
    });
    return { ok: true, data: result };
  }
}
