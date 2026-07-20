import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { DeleteCategoryUseCase } from '../../../categories/application/use-cases/delete-category.use-case';
import { CategoryNotFoundError } from '../../../categories/domain/errors/category-not-found.error';

const inputSchema = z.object({ id: z.uuid() });

@RegisterAssistantTool()
export class DeleteCategoryTool implements AssistantTool {
  readonly name = 'delete_category';
  readonly description =
    'Deletes a custom category owned by the current user. Global defaults cannot be deleted. Linked transactions keep their reference set to null.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
    required: ['id'],
    additionalProperties: false,
  };
  readonly playbook =
    'Remove uma categoria custom do user. Categorias default globais NÃO podem ser deletadas — se o user pedir, explique que são compartilhadas e sugira ignorá-la. Deletar não apaga transactions vinculadas (elas ficam com categoryId=null), mas é irreversível — confirme com o user antes de invocar. Requer só o id.';

  constructor(private readonly deleteCategory: DeleteCategoryUseCase) {}

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
      await this.deleteCategory.execute({
        id: parsed.data.id,
        userId: ctx.userId,
      });
      return { ok: true, data: { id: parsed.data.id, deleted: true } };
    } catch (e) {
      if (e instanceof CategoryNotFoundError) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
