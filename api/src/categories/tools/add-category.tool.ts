import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../../tools/domain/assistant-tool';
import { RegisterAssistantTool } from '../../tools/infrastructure/register-assistant-tool.decorator';
import { AddCategoryUseCase } from '../application/use-cases/add-category.use-case';
import { addCategorySchema } from '../dto/add-category.dto';

@RegisterAssistantTool()
export class AddCategoryTool implements AssistantTool {
  readonly name = 'add_category';
  readonly description =
    'Creates a custom category owned by the current user. Only visible to this user; does not affect global defaults.';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 80 },
      icon: { type: 'string', minLength: 1, maxLength: 50 },
      color: { type: 'string', minLength: 1, maxLength: 20 },
    },
    required: ['name'],
    additionalProperties: false,
  };
  readonly playbook =
    'Cria uma categoria personalizada pro user. Antes de invocar, verifique se já não existe categoria com nome parecido nas visíveis do user — sugira usar a existente. Confirme o nome com o user antes. Aceita icon opcional (string livre, ex nome de ícone Lucide) e color opcional (hex ou nome). Categoria custom fica visível só pro user, sem afetar as globais.';

  constructor(private readonly addCategory: AddCategoryUseCase) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = addCategorySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    const category = await this.addCategory.execute({
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: category };
  }
}
