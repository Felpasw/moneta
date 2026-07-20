import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { RenameCategoryUseCase } from '../../../categories/application/use-cases/rename-category.use-case';
import { CategoryNotFoundError } from '../../../categories/domain/errors/category-not-found.error';

const inputSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
});

@RegisterAssistantTool()
export class RenameCategoryTool implements AssistantTool {
  readonly name = 'rename_category';
  readonly description =
    'Renames a custom category owned by the current user. Global default categories cannot be renamed.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, maxLength: 80 },
    },
    required: ['id', 'name'],
    additionalProperties: false,
  };
  readonly playbook =
    'Renomeia uma categoria custom do user. Categorias default globais (Alimentação, Transporte, etc.) NÃO podem ser renomeadas — se o user pedir, explique que são compartilhadas com todos e sugira criar uma custom com o nome desejado. Requer id e novo name. Confirme com o user antes de invocar. Se a categoria não existir ou for global, retorna erro.';

  constructor(private readonly renameCategory: RenameCategoryUseCase) {}

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
      const category = await this.renameCategory.execute({
        id: parsed.data.id,
        userId: ctx.userId,
        name: parsed.data.name,
      });
      return { ok: true, data: category };
    } catch (e) {
      if (e instanceof CategoryNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
