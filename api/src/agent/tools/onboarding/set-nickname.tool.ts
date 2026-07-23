import { z } from 'zod';

import { UsersService } from '../../../users/users.service';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({
  nickname: z.string().min(1).max(50),
});

@RegisterAssistantTool()
export class SetNicknameTool implements AssistantTool {
  readonly name = 'set_nickname';
  readonly description =
    'Salva como o user quer ser chamado pelo assistente. Roda no onboarding uma vez.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      nickname: { type: 'string', minLength: 1, maxLength: 50 },
    },
    required: ['nickname'],
    additionalProperties: false,
  };
  readonly playbook =
    'Chame depois que o user disser como quer ser chamado, no primeiro contato. Confirme por voz que o apelido X foi salvo e mencione UMA VEZ SÓ que ele pode alterar isso a qualquer momento pelo perfil. Não repita essa menção em conversas futuras. Se a tool retornar erro, peça o apelido de novo com uma frase curta.';

  constructor(private readonly users: UsersService) {}

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
    const result = await this.users.updateNickname(
      ctx.userId,
      parsed.data.nickname,
    );
    return { ok: true, data: result };
  }
}
