import { z } from 'zod';

import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';
import { PayInvoiceUseCase } from '../../../finance/card-billing/application/use-cases/pay-invoice.use-case';
import { InvoiceAlreadyPaidError } from '../../../finance/card-billing/domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '../../../finance/card-billing/domain/errors/invoice-not-found.error';
import { SameAccountTransferError } from '../../../finance/transfers/domain/errors/same-account-transfer.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({
  invoiceId: z.uuid(),
  fromAccountId: z.uuid(),
});

@RegisterAssistantTool()
export class PayInvoiceTool implements AssistantTool {
  readonly name = 'pay_invoice';
  readonly description =
    'Pays a credit card invoice atomically: creates a transfer from the given source account to the card account for exactly the invoice total_amount, then marks the invoice paid and links the payment transfer.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      invoiceId: { type: 'string', format: 'uuid' },
      fromAccountId: { type: 'string', format: 'uuid' },
    },
    required: ['invoiceId', 'fromAccountId'],
    additionalProperties: false,
  };
  readonly playbook =
    'Use quando o user pedir explicitamente pra pagar uma fatura, movendo dinheiro dentro do app ("paga a fatura X tirando da conta Y"). Confirme os 2 campos antes: (1) qual fatura (id) e (2) de qual conta sai o dinheiro. O valor pago é SEMPRE o total_amount da fatura — user não escolhe valor parcial aqui. Cria a transferência (conta origem → cartão) automaticamente com o valor exato e marca a fatura como paga, tudo amarrado (paid_via_transfer_id). Se o pagamento já aconteceu por fora do app (banco, boleto direto) e o user quer só registrar o status da fatura sem gerar movimento, use a tool de marcação manual. Rejeita fatura já paga, fatura inexistente, ou fonte não pertencente ao user.';

  constructor(private readonly payInvoice: PayInvoiceUseCase) {}

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
      const result = await this.payInvoice.execute({
        invoiceId: parsed.data.invoiceId,
        fromAccountId: parsed.data.fromAccountId,
        userId: ctx.userId,
      });
      return { ok: true, data: result };
    } catch (e) {
      if (
        e instanceof InvoiceNotFoundError ||
        e instanceof InvoiceAlreadyPaidError ||
        e instanceof AccountNotFoundError ||
        e instanceof SameAccountTransferError
      ) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
