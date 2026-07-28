import { z } from 'zod';

import type {
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z.object({}).strict();

@RegisterAssistantTool()
export class FinishSetupTool implements AssistantTool {
  readonly name = 'finish_setup';
  readonly description =
    'Encerra a etapa de coleta do onboarding e sinaliza pro frontend redirecionar pro dashboard. NÃO marca onboardedAt — a marcação como onboarded acontece depois do tour, no dashboard.';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Chame no fim da coleta do onboarding, depois do apelido + bancos + saldos (obrigatórios). Cartão e cheque especial são opcionais — não bloqueiam. Emite sinal pro frontend redirecionar pro /dashboard, onde o tour do assistente continua. Esta tool NÃO marca o user como onboarded: só finaliza a etapa de coleta e pede pro frontend virar de página. A marcação definitiva acontece depois do tour, via outra tool específica.';

  execute(input: unknown): Promise<AssistantToolResult> {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      return Promise.resolve({
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      });
    }
    return Promise.resolve({
      ok: true,
      sideEffects: [{ kind: 'redirect', target: '/dashboard' }],
    });
  }
}
