import { z } from 'zod';

import { AddUserBanksUseCase } from '../../../finance/accounts/application/use-cases/add-user-banks.use-case';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({
  bankIds: z.array(z.uuid()).min(1),
});

@RegisterAssistantTool()
export class AddUserBanksTool implements AssistantTool {
  readonly name = 'add_user_banks';
  readonly description =
    'Cria contas do user pros bancos escolhidos, a partir dos IDs confirmados na interface. Retorna created + notFound (IDs que não existem no catálogo).';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      bankIds: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        minItems: 1,
      },
    },
    required: ['bankIds'],
    additionalProperties: false,
  };
  readonly playbook =
    'Chame durante o onboarding depois que o user confirmar visualmente na interface quais bancos ele usa. O frontend expõe o catálogo e o user marca os que tem — você recebe os IDs pra criar. Nunca invente bankId: use SEMPRE os IDs que vieram da escolha do user. Se algum ID vier em notFound, avise que houve inconsistência (não deveria acontecer no fluxo normal) e peça pra escolher de novo. Se created estiver vazio, não avance pra etapa de saldos.';

  constructor(private readonly useCase: AddUserBanksUseCase) {}

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
    const result = await this.useCase.execute({
      userId: ctx.userId,
      bankIds: parsed.data.bankIds,
    });
    return { ok: true, data: result };
  }
}
