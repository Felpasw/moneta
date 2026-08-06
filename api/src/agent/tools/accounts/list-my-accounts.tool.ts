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
    'Returns all bank accounts owned by the current user (items) plus a summary aggregating checking accounts (totalBalance, checkingCount, totalOverdraft).';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna `{ items, summary }`. `items` = todas as contas do user (com saldo, limite de crédito, cheque especial e bank embed). `summary` agrega SÓ checking accounts: `totalBalance` = soma dos saldos, `checkingCount` = quantas checking, `totalOverdraft` = soma dos cheques especiais. Sem input; o dono é sempre o user da sessão. Use `summary.totalBalance` pra responder "quanto tenho no total" (sem somar do lado do agent). Use `items[].id` antes de operações que precisam do id. Read-only, seguro chamar sem confirmação.';

  constructor(private readonly listMyAccounts: ListMyAccountsUseCase) {}

  async execute(
    _input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const accounts = await this.listMyAccounts.execute({ userId: ctx.userId });
    return { ok: true, data: accounts };
  }
}
