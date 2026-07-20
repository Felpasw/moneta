import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';
import { ListMyAccountsUseCase } from '../../../finance/accounts/application/use-cases/list-my-accounts.use-case';

@RegisterAssistantTool()
export class ListMyAccountsTool implements AssistantTool {
  readonly name = 'list_my_accounts';
  readonly description =
    'Returns all bank accounts owned by the current user, including balance, credit limit, and overdraft limit.';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna todas as contas do user (com saldo, limite de crédito e cheque especial). Sem input; o dono é sempre o user da sessão. Use pra responder quanto tenho, quais minhas contas, ou pra obter o id de uma conta antes de operações que precisam dele. Read-only, seguro chamar sem confirmação.';

  constructor(private readonly listMyAccounts: ListMyAccountsUseCase) {}

  async execute(
    _input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const accounts = await this.listMyAccounts.execute({ userId: ctx.userId });
    return { ok: true, data: accounts };
  }
}
