import { z } from 'zod';

import { CancelInstallmentPurchaseUseCase } from '../../../finance/card-billing/installments/application/use-cases/cancel-installment-purchase.use-case';
import { InstallmentGroupNotFoundError } from '../../../finance/card-billing/installments/domain/errors/installment-group-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({ groupId: z.uuid() });

@RegisterAssistantTool()
export class CancelInstallmentPurchaseTool implements AssistantTool {
  readonly name = 'cancel_installment_purchase';
  readonly description =
    'Cancels an installment purchase group entirely: deletes all N installment transactions, reverts card balance for each, and shrinks the total_amount of every invoice they touched. Returns a summary { deletedCount, affectedInvoiceIds, refundedAmount }.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      groupId: { type: 'string', format: 'uuid' },
    },
    required: ['groupId'],
    additionalProperties: false,
  };
  readonly playbook =
    'Cancela uma compra parcelada inteira — todas as N parcelas somem de uma vez, o saldo do cartão volta como se a compra nunca tivesse acontecido, e as faturas afetadas encolhem no total. Use quando o user disser "cancela aquele parcelamento do PS5", "estorna essa compra parcelada", "deleta as 12 parcelas do X". SEMPRE confirma com o user antes de invocar — é IRREVERSÍVEL pelo assistente. Requer groupId; se o user só souber a descrição, primeiro use uma tool de leitura pra achar o id, ou peça pro user informar. Retorna resumo: deletedCount (quantas parcelas foram apagadas), affectedInvoiceIds (quais faturas encolheram), refundedAmount (soma "devolvida" ao limite do cartão).';

  constructor(
    private readonly cancelInstallmentPurchase: CancelInstallmentPurchaseUseCase,
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
      const result = await this.cancelInstallmentPurchase.execute({
        groupId: parsed.data.groupId,
        userId: ctx.userId,
      });
      return { ok: true, data: result };
    } catch (e) {
      if (e instanceof InstallmentGroupNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
