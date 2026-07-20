import { z } from 'zod';

import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';
import { GetCurrentInvoiceUseCase } from '../../../finance/card-billing/application/use-cases/get-current-invoice.use-case';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({ accountId: z.uuid() });

@RegisterAssistantTool()
export class GetCurrentInvoiceTool implements AssistantTool {
  readonly name = 'get_current_invoice';
  readonly description =
    'Returns the currently OPEN invoice of a credit card account (what the user is spending right now this cycle). Returns null when the card has no purchases yet in the current cycle. Includes totalAmount, cycleStart, cycleEnd, dueDate.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      accountId: { type: 'string', format: 'uuid' },
    },
    required: ['accountId'],
    additionalProperties: false,
  };
  readonly playbook =
    'Use pra responder perguntas do tipo "quanto tô devendo no cartão X?", "quando fecha minha fatura?" ou "quando vence a próxima fatura?". Retorna a fatura OPEN (a que ainda tá acumulando gastos do ciclo corrente). Se retornar null, o cartão não teve compras nesse ciclo ainda — informa o user. Read-only, sem confirmação. Requer conta cartão (com creditLimit); se passar conta de débito, o retorno vai ser null porque débito não tem invoice. `totalAmount` é o quanto foi gasto no ciclo até agora; `dueDate` é quando a fatura fechada precisa ser paga; `cycleEnd` é quando a fatura FECHA (data em que os gastos param de entrar nela).';

  constructor(private readonly getCurrentInvoice: GetCurrentInvoiceUseCase) {}

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
      const invoice = await this.getCurrentInvoice.execute({
        accountId: parsed.data.accountId,
        userId: ctx.userId,
      });
      return { ok: true, data: invoice };
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
