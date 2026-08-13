import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { AddCreditPurchaseUseCase } from '../../../finance/transactions/application/use-cases/add-credit-purchase.use-case';
import { InvalidCreditPurchaseError } from '../../../finance/transactions/domain/errors/invalid-credit-purchase.error';
import { addCreditPurchaseSchema } from '../../../finance/transactions/dto/add-credit-purchase.dto';

@RegisterAssistantTool()
export class AddCreditPurchaseTool implements AssistantTool {
  readonly name = 'add_credit_purchase';
  readonly description =
    'Registers a single credit-card purchase — expense that goes into the current invoice of the account, NOT into balance. The account must have a credit card configured (creditLimit + closeDay + dueDay).';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      accountId: { type: 'string', format: 'uuid' },
      amount: { type: 'number', exclusiveMinimum: 0 },
      categoryId: { type: 'string', format: 'uuid' },
      description: { type: 'string', maxLength: 255 },
      occurredAt: { type: 'string', format: 'date-time' },
    },
    required: ['accountId', 'amount', 'occurredAt'],
    additionalProperties: false,
  };
  readonly playbook =
    'Registra uma COMPRA NO CARTÃO DE CRÉDITO (expense). Vai pra fatura da conta (invoice), NÃO afeta o balance. Use quando o user disser explicitamente "gastei no cartão", "comprei no crédito", "coloquei no cartão", "cartão de crédito". Amount SEMPRE positivo. Nunca invente data (occurredAt) — pergunte ao user; a data define em qual fatura a compra cai (segundo close_day/due_day da conta). Confirme antes de invocar: conta, valor, descrição, data. Sugira categoria mas confirme. A conta precisa ter cartão configurado (creditLimit/closeDay/dueDay) — senão retorna InvalidCreditPurchaseError. Compras parceladas têm tool próprio (installment). Gastos no débito/Pix/dinheiro têm tool próprio (débito).';

  constructor(private readonly addCreditPurchase: AddCreditPurchaseUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = addCreditPurchaseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    try {
      const transaction = await this.addCreditPurchase.execute({
        userId: ctx.userId,
        ...parsed.data,
      });
      return { ok: true, data: transaction };
    } catch (e) {
      if (
        e instanceof AccountNotFoundError ||
        e instanceof InvalidCreditPurchaseError
      ) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
