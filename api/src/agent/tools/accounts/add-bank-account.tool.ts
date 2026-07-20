import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { AddBankAccountUseCase } from '../../../finance/accounts/application/use-cases/add-bank-account.use-case';
import { InvalidCreditCardConfigError } from '../../../finance/accounts/domain/errors/invalid-credit-card-config.error';
import { addBankAccountSchema } from '../../../finance/accounts/dto/add-bank-account.dto';

@RegisterAssistantTool()
export class AddBankAccountTool implements AssistantTool {
  readonly name = 'add_bank_account';
  readonly description =
    'Creates a new bank account for the current user. Provide the bank id, a nickname, and optionally initial balance, credit limit, close day and due day for credit card accounts.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      bankId: { type: 'string', format: 'uuid' },
      nickname: { type: 'string', minLength: 1, maxLength: 80 },
      initialBalance: { type: 'number' },
      creditLimit: { type: 'number', minimum: 0 },
      overdraftLimit: { type: 'number', minimum: 0 },
      closeDay: { type: 'integer', minimum: 1, maximum: 31 },
      dueDay: { type: 'integer', minimum: 1, maximum: 31 },
    },
    required: ['bankId', 'nickname'],
    additionalProperties: false,
  };
  readonly playbook =
    'Cria uma nova conta bancária pro user. SEMPRE confirme com o user antes de invocar: nickname (nome curto e legível), banco escolhido, e saldo inicial se houver. Regra crítica de cartão de crédito: se o user disser que é cartão, os 3 campos precisam vir juntos — creditLimit (número positivo), closeDay (1-31, dia do fechamento), dueDay (1-31, dia do vencimento). Nunca invente esses valores — pergunte. Cartão sempre tem limite; se o user disser sem limite ele está errado, esclareça. Contas comuns (débito, corrente, poupança) NUNCA recebem creditLimit/closeDay/dueDay. Após criar, confirme pro user com nickname e o que foi salvo.';

  constructor(private readonly addBankAccount: AddBankAccountUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = addBankAccountSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    try {
      const account = await this.addBankAccount.execute({
        userId: ctx.userId,
        ...parsed.data,
      });
      return { ok: true, data: account };
    } catch (e) {
      if (e instanceof InvalidCreditCardConfigError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
