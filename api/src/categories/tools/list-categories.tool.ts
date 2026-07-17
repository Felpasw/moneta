import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../../tools/domain/assistant-tool';
import { RegisterAssistantTool } from '../../tools/infrastructure/register-assistant-tool.decorator';
import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case';

@RegisterAssistantTool()
export class ListCategoriesTool implements AssistantTool {
  readonly name = 'list_categories';
  readonly description =
    'Returns all categories visible to the current user: global defaults plus categories the user created.';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna todas as categorias visíveis pro user (defaults globais + custom que ele criou). Sem input. Use antes de sugerir ou criar categoria em qualquer operação — categoria já existente é sempre preferível a criar nova. Read-only, seguro chamar sem confirmação. Categorias com userId=null são globais e compartilhadas com todos os users; as demais pertencem só a esse user.';

  constructor(private readonly listCategories: ListCategoriesUseCase) {}

  async execute(
    _input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const categories = await this.listCategories.execute({
      userId: ctx.userId,
    });
    return { ok: true, data: categories };
  }
}
