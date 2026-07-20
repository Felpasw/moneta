import { z } from 'zod';

import { MarkInvoicePaidUseCase } from '../../../finance/card-billing/application/use-cases/mark-invoice-paid.use-case';
import { InvoiceAlreadyPaidError } from '../../../finance/card-billing/domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '../../../finance/card-billing/domain/errors/invoice-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({ invoiceId: z.uuid() });

@RegisterAssistantTool()
export class MarkInvoicePaidTool implements AssistantTool {
  readonly name = 'mark_invoice_paid';
  readonly description =
    'Marks a credit card invoice as PAID without creating any transfer. Fallback for cases when the user paid the card outside this app (bank app, boleto, etc) and just wants to update the record.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      invoiceId: { type: 'string', format: 'uuid' },
    },
    required: ['invoiceId'],
    additionalProperties: false,
  };
  readonly playbook =
    'Use SOMENTE quando o user já pagou a fatura por fora do app (banco, boleto direto, etc) e só quer registrar o status. NÃO cria transferência nem mexe em saldo — só flipa status pra `paid` e grava paidAt=agora. paid_via_transfer_id fica null (sinal de pagamento manual sem transfer amarrado). Se o pagamento ainda VAI acontecer e o user quer que o app faça o movimento entre contas dele automaticamente, use a tool que compõe transferência + pagamento em uma operação. Rejeita fatura inexistente ou fatura já paga. Confirma com o user antes de invocar — a mudança é irreversível pelo assistente sem outra tool.';

  constructor(private readonly markInvoicePaid: MarkInvoicePaidUseCase) {}

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
      await this.markInvoicePaid.execute({
        invoiceId: parsed.data.invoiceId,
        userId: ctx.userId,
      });
      return { ok: true, data: { id: parsed.data.invoiceId, paid: true } };
    } catch (e) {
      if (
        e instanceof InvoiceNotFoundError ||
        e instanceof InvoiceAlreadyPaidError
      ) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
