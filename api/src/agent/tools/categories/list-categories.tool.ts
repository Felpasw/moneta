import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { ListCategoriesUseCase } from '../../../finance/categories/application/use-cases/list-categories.use-case';

@RegisterAssistantTool()
export class ListCategoriesTool implements AssistantTool {
  readonly name = 'list_categories';
  readonly description =
    'Returns all categories visible to the current user (globals + user custom) enriched with current-month spent, usagePct and overBudget.';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna todas as categorias visíveis pro user (defaults globais + custom que ele criou), cada uma enriquecida com dados do mês corrente: `spent` (soma dos expenses da categoria no mês, em BRL), `monthlyBudget` (teto opcional definido pelo user, `null` se não definido), `usagePct` (0-100 quando há budget; `0` sem budget), `overBudget` (true quando `spent > monthlyBudget`). Sem input. Use antes de sugerir/criar categoria — existente é sempre preferível. Use `spent` pra "quanto gastei em X esse mês", `overBudget` pra alertas de estouro, `usagePct` pra progresso do budget. Read-only, seguro chamar sem confirmação. Categorias com `userId=null` são globais e compartilhadas; as demais pertencem só a esse user (defaults globais sempre têm `monthlyBudget=null`).';

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
