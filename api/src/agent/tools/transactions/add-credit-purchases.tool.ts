import { z } from 'zod';

import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { AddManyCreditPurchasesUseCase } from '../../../finance/transactions/application/use-cases/add-many-credit-purchases.use-case';
import { InvalidCreditPurchaseError } from '../../../finance/transactions/domain/errors/invalid-credit-purchase.error';
import { addCreditPurchaseSchema } from '../../../finance/transactions/dto/add-credit-purchase.dto';

const inputSchema = z.object({
  purchases: z.array(addCreditPurchaseSchema).min(1).max(50),
});

@RegisterAssistantTool()
export class AddCreditPurchasesTool implements AssistantTool {
  readonly name = 'add_credit_purchases';
  readonly description =
    'Registers multiple credit-card purchases in a single atomic batch. Either all succeed or none is persisted. Each purchase goes into the invoice of its account, NOT into balance.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      purchases: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
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
        },
      },
    },
    required: ['purchases'],
    additionalProperties: false,
  };
  readonly playbook =
    'Registra várias COMPRAS NO CARTÃO DE CRÉDITO de uma vez, atomicamente — ou TODAS entram ou NENHUMA. Cada purchase cai na fatura da conta, sem afetar balance. Use quando o user reporta múltiplos gastos no cartão no mesmo turno. Máximo 50 itens. Amount SEMPRE positivo. Confirme com o user TODOS os itens antes — mostre um resumo. Todas as contas referenciadas precisam ter cartão configurado — se alguma não tiver, o batch inteiro é revertido. Gastos no débito/Pix têm tool próprio (débito). Ordem de recebimento é preservada no retorno.';

  constructor(
    private readonly addManyCreditPurchases: AddManyCreditPurchasesUseCase,
  ) {}

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
      const results = await this.addManyCreditPurchases.execute(
        parsed.data.purchases.map((p) => ({ userId: ctx.userId, ...p })),
      );
      return { ok: true, data: results };
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
