import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { DeleteTransferUseCase } from '../../../transfers/application/use-cases/delete-transfer.use-case';
import { TransferNotFoundError } from '../../../transfers/domain/errors/transfer-not-found.error';

const inputSchema = z.object({ id: z.uuid() });

@RegisterAssistantTool()
export class DeleteTransferTool implements AssistantTool {
  readonly name = 'delete_transfer';
  readonly description =
    'Deletes a transfer and reverses both account balances atomically (credits back the source, debits back the destination).';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
    required: ['id'],
    additionalProperties: false,
  };
  readonly playbook =
    'Remove uma transferência. Os saldos das duas contas envolvidas são ajustados automaticamente pra reverter o efeito original (crédito devolvido à origem, débito devolvido do destino). Confirme com o user antes de invocar — é irreversível. Requer só o id.';

  constructor(private readonly deleteTransfer: DeleteTransferUseCase) {}

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
      await this.deleteTransfer.execute({
        id: parsed.data.id,
        userId: ctx.userId,
      });
      return { ok: true, data: { id: parsed.data.id, deleted: true } };
    } catch (e) {
      if (e instanceof TransferNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
