import { z } from 'zod';

import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { UpdateCategoryUseCase } from '../../../finance/categories/application/use-cases/update-category.use-case';
import { CategoryNotFoundError } from '../../../finance/categories/domain/errors/category-not-found.error';

const inputSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1).max(80).optional(),
    icon: z.string().max(50).nullable().optional(),
    color: z.string().max(20).nullable().optional(),
    monthlyBudget: z.number().positive().nullable().optional(),
  })
  .refine(
    (dto) =>
      dto.name !== undefined ||
      dto.icon !== undefined ||
      dto.color !== undefined ||
      dto.monthlyBudget !== undefined,
    { message: 'At least one field must be provided.' },
  );

@RegisterAssistantTool()
export class UpdateCategoryTool implements AssistantTool {
  readonly name = 'update_category';
  readonly description =
    'Updates a custom category owned by the current user (name, icon, color, monthlyBudget). Global default categories cannot be updated.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', minLength: 1, maxLength: 80 },
      icon: { type: ['string', 'null'], maxLength: 50 },
      color: { type: ['string', 'null'], maxLength: 20 },
      monthlyBudget: { type: ['number', 'null'], exclusiveMinimum: 0 },
    },
    required: ['id'],
    additionalProperties: false,
  };
  readonly playbook =
    'Atualiza uma categoria custom do user. Categorias default globais (Alimentação, Transporte, etc.) NÃO podem ser alteradas — se o user pedir, explique que são compartilhadas com todos e sugira criar uma custom. Requer `id` + ao menos um dos campos opcionais (`name`, `icon`, `color`, `monthlyBudget`). `monthlyBudget` (BRL) é opt-in por categoria: setar um número > 0 define o teto do mês; `null` explícito remove o budget. Um budget por categoria (não cumulativo com sub-categorias). Confirme com o user antes de invocar. Se a categoria não existir ou for global, retorna erro.';

  constructor(private readonly updateCategory: UpdateCategoryUseCase) {}

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
      const category = await this.updateCategory.execute({
        id: parsed.data.id,
        userId: ctx.userId,
        name: parsed.data.name,
        icon: parsed.data.icon,
        color: parsed.data.color,
        monthlyBudget: parsed.data.monthlyBudget,
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
