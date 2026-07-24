import { z } from 'zod';

import { CompleteOnboardingUseCase } from '../../../onboarding/application/use-cases/complete-onboarding.use-case';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({}).strict();

@RegisterAssistantTool()
export class CompleteOnboardingTool implements AssistantTool {
  readonly name = 'complete_onboarding';
  readonly description =
    'Marca o onboarding do user como concluído. Requer nickname setado + pelo menos uma conta bancária. Cartão de crédito e cheque especial são opcionais — não bloqueiam.';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Chame no fim do onboarding depois de ter coletado apelido + bancos + saldos (obrigatórios). Cartão de crédito e cheque especial são OPCIONAIS — pode chamar mesmo sem eles configurados. Se retornar ok: false com missing, o que faltou está listado (nickname ou banks) — corrija a etapa faltante coletando a info do user e tente de novo. Se retornar ok: true com alreadyOnboarded: true, o user já tinha completado antes — só confirme por voz que está tudo pronto. Se retornar ok: true sem alreadyOnboarded, é o fechamento definitivo — dê boas-vindas curtas e diga que ele já pode começar a usar.';

  constructor(private readonly useCase: CompleteOnboardingUseCase) {}

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
    const result = await this.useCase.execute({ userId: ctx.userId });
    return { ok: true, data: result };
  }
}
