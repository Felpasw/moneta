import { z } from 'zod';

import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';
import { ListInvoicesUseCase } from '../../../finance/card-billing/application/use-cases/list-invoices.use-case';
import { InvoiceStatus } from '../../../finance/card-billing/domain/constants/invoice-status';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({
  accountId: z.uuid(),
  status: z.enum(InvoiceStatus).optional(),
});

@RegisterAssistantTool()
export class ListInvoicesTool implements AssistantTool {
  readonly name = 'list_invoices';
  readonly description =
    'Lists invoices of a credit card account, optionally filtered by status (open/closed/paid/overdue). Ordered by cycle_start descending — mais recentes primeiro.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      accountId: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: ['open', 'closed', 'paid', 'overdue'] },
    },
    required: ['accountId'],
    additionalProperties: false,
  };
  readonly playbook =
    'Use pra listar histórico de faturas de um cartão. Sem status = todas. Com status: `open` (só a atual acumulando), `closed` (fechada aguardando pagamento), `paid` (já pagas), `overdue` (venceu sem pagar). Ordenado do mais recente pro mais antigo. Read-only, sem confirmação. Retorna as invoices completas com totalAmount, cycleStart, cycleEnd, dueDate, paidAt.';

  constructor(private readonly listInvoices: ListInvoicesUseCase) {}

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
      const invoices = await this.listInvoices.execute({
        accountId: parsed.data.accountId,
        userId: ctx.userId,
        status: parsed.data.status,
      });
      return { ok: true, data: invoices };
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
