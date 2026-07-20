import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { CreateTransferUseCase } from '../../../transfers/application/use-cases/create-transfer.use-case';
import { SameAccountTransferError } from '../../../transfers/domain/errors/same-account-transfer.error';
import { createTransferSchema } from '../../../transfers/dto/create-transfer.dto';

@RegisterAssistantTool()
export class CreateTransferTool implements AssistantTool {
  readonly name = 'create_transfer';
  readonly description =
    'Registers a transfer between two of the user own accounts. Debits the source and credits the destination atomically. Does not count as an expense or income in reports.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      fromAccountId: { type: 'string', format: 'uuid' },
      toAccountId: { type: 'string', format: 'uuid' },
      amount: { type: 'number', exclusiveMinimum: 0 },
      description: { type: 'string', maxLength: 255 },
      occurredAt: { type: 'string', format: 'date-time' },
    },
    required: ['fromAccountId', 'toAccountId', 'amount', 'occurredAt'],
    additionalProperties: false,
  };
  readonly playbook =
    'Registra uma transferência entre duas contas do próprio user. Regras críticas: SEMPRE confirme os 3 campos essenciais antes de invocar — conta de origem, conta de destino, valor. Transferência NÃO é gasto nem receita — avise o user que ela não afeta os totais de gasto/renda no dashboard, só move dinheiro entre as contas dele. Origem e destino têm que ser contas DIFERENTES (mesmo id nas duas dá erro). Pra pagar fatura de cartão, use uma transferência com destino sendo a conta do cartão. Nunca invente occurredAt — pergunte. Se qualquer uma das contas não pertencer ao user, retorna erro.';

  constructor(private readonly createTransfer: CreateTransferUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = createTransferSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    try {
      const transfer = await this.createTransfer.execute({
        userId: ctx.userId,
        ...parsed.data,
      });
      return { ok: true, data: transfer };
    } catch (e) {
      if (
        e instanceof SameAccountTransferError ||
        e instanceof AccountNotFoundError
      ) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
