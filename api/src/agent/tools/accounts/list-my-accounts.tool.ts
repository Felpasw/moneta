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
    'Returns all bank accounts owned by the current user (items with bank + currentInvoice + usagePct embedded) plus a summary. totalBalance sums balance across ALL accounts (checkings + credit cards); checkingCount and totalOverdraft still cover only checking accounts.';
  readonly jsonSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
  readonly playbook =
    'Retorna `{ items, summary }`. `items` = todas as contas do user com: saldo, limite de crédito, cheque especial, `bank` (id/name/compeCode/logoUrl), `currentInvoice` (fatura em aberto — `{ totalAmount, status, dueDate, cycleStart, cycleEnd }` ou null se checking/sem fatura aberta) e `usagePct` (0–100, quanto da fatura em aberto ocupa do creditLimit — sempre 0 pra checking ou sem invoice). `summary`: `totalBalance` = soma do balance de TODAS as contas (checkings + cartões — se o user setou initialBalance num cartão, entra aqui também); `checkingCount` = quantas contas checking; `totalOverdraft` = soma dos cheques especiais (só checking — cartão não tem overdraft). Sem input; o dono é sempre o user da sessão. Use `summary.totalBalance` pra "quanto tenho no total"; `items[].currentInvoice.totalAmount` pra "quanto tô devendo no cartão X"; `items[].usagePct` pra "quanto ocupei do limite". Use `items[].id` antes de operações que precisam do id. Read-only, seguro chamar sem confirmação.';

  constructor(private readonly listMyAccounts: ListMyAccountsUseCase) {}

  async execute(
    _input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const accounts = await this.listMyAccounts.execute({ userId: ctx.userId });
    return { ok: true, data: accounts };
  }
}
