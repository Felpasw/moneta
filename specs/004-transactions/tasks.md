# Transações, contas, transferências e faturas (MNT-122 … MNT-146)

## Decisões (inline)

- **Contas**: `user_bank_accounts` sem `account_type` — a mesma conta serve pra spending/saving/investing. Cartão de crédito é identificado por `credit_limit` presente + campos de ciclo (`close_day`, `due_day`)
- **Transfers**: tabela própria `transfers` — nunca infla totais de gasto/renda. Reports filtram fora
- **Categorias**: livre-forma por user. **Sem tags**. Seed inicial de categorias default (Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Assinaturas, Salário, Outros). User pode criar próprias
- **Balance**: `set_balance({ accountId, amount })` sobrescreve o campo. Sistema começa a rastrear a partir daí — sem transação fake de ajuste
- **Cartão de crédito**: modelagem completa de ciclos (Opção B). `credit_card_invoices` amarrada a `user_bank_accounts` com `close_day`/`due_day`. Transações no cartão resolvem `invoice_id` automaticamente pela data. Pagamento detectado via `transfer` com destino cartão + valor match
- **Atomicidade de saldo**: toda operação que altera saldo (transaction insert/delete/edit, transfer, invoice payment) roda numa transação DB única — nunca fica saldo dessincronizado
- **Todo tool novo tem `playbook`** (contrato de MNT-52 pós-atualização). Sem playbook, tool não passa no linter

## Depende de

| Item | Spec | Necessário pra |
|------|------|----------------|
| Auth Fase 1 | 002-auth | Ownership de tudo (userId da sessão) |
| ToolRegistry + Dispatcher | 003-assistant Fase 2 | Registrar as ~15 tools novas |
| `get_tool_help` (MNT-94) | 003-assistant Fase 2.5 | Playbooks on-demand |
| Postgres + TypeORM | 002-auth Fase 0 | Migrations |
| UI shell (MNT-98..99) | 007-ui-shell | Onde montar `/transactions`, `/banks`, `/invoices` |
| shadcn (MNT-71) | 002-auth Fase 1.5 | Componentes das páginas |

## Convenções

Mesmas do resto dos specs. Bundle onde faz sentido (várias tools do mesmo domínio num commit só).

---

## Fase 0 — Schema base

- [ ] **MNT-122** [T][S] Migration `financial_core`: cria em uma leva `banks` (catálogo global), `user_bank_accounts` (com `close_day`, `due_day`, `credit_limit`, `overdraft_limit`, `nickname NOT NULL`), `categories` (user_id nullable — NULL = default global), `transactions` (com `invoice_id` FK opcional pra amarrar cartão), `transfers`, `credit_card_invoices`. FKs, checks e índices conforme modelo aprovado (ver `specs/000-product-brief/spec.md` — modelo financeiro)
- [ ] **MNT-123** [T][S] Seed: (a) top ~20 bancos BR com nome, código COMPE, logo_url; (b) categorias default globais (Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Assinaturas, Salário, Investimentos, Outros). Seed roda idempotente (INSERT ... ON CONFLICT DO NOTHING)

---

## Fase 1 — Bancos & contas

- [ ] **MNT-124** [T][S] Módulo `banks/` (Clean Arch): use-cases `ListBanks` (catálogo público), repository read-only sobre a tabela seedada. Endpoint `GET /banks`
- [ ] **MNT-125** [T][S] Módulo `accounts/`: `UserBankAccountRepository` + use-cases `ListMyAccounts`, `AddBankAccount({ bankId, nickname, initialBalance?, creditLimit?, closeDay?, dueDay? })`, `UpdateBankAccount`, `DeleteBankAccount`, `SetBalance({ accountId, amount })`. Endpoints REST equivalentes. Ownership: filtro `user_id` obrigatório em todos
- [ ] **MNT-126** [T][S] Tools do assistente (bundle) — cada um com playbook inline:
  - `list_banks` — lista o catálogo (só read)
  - `list_my_accounts` — lista as contas do user com saldo e limite
  - `add_bank_account({ bankId, nickname, initialBalance?, creditLimit?, closeDay?, dueDay? })` — playbook enfatiza: confirme com user antes; se `creditLimit` presente, `closeDay` e `dueDay` obrigatórios
  - `update_bank_account({ id, ...fields })`
  - `delete_bank_account({ id })` — playbook: só permitir se conta sem transactions; caso contrário orientar o user a arquivar
  - `set_balance({ accountId, amount })` — playbook: confirma valor; explica que sobrescreve balance sem criar transação

---

## Fase 2 — Categorias

- [ ] **MNT-127** [T][S] `CategoryRepository` + use-cases `ListCategories(userId)` (retorna defaults globais + custom do user), `AddCategory({ name, icon?, color? })`, `RenameCategory`, `DeleteCategory` (só custom; defaults globais não deletáveis). Endpoints REST
- [ ] **MNT-128** [T][S] Tools (bundle): `list_categories`, `add_category`, `rename_category`, `delete_category`. Playbooks curtas — categoria é conceito simples

---

## Fase 3 — Transações

- [ ] **MNT-129** [T][S] `TransactionRepository` + use-cases `AddTransaction`, `EditTransaction`, `DeleteTransaction`, `ListTransactions(filters)`. Filtros: dateRange, accountIds, categoryIds, types, textSearch, limit/offset. Endpoints REST
- [ ] **MNT-130** [T][S] Balance auto-update — todo insert/edit/delete de transaction ajusta `user_bank_accounts.balance` **na mesma transação DB** (BEGIN/COMMIT), pra nunca ficar dessincronizado. Testes cobrindo: rollback em erro no meio (nem transaction nem balance mudam), edit muda valor (delta aplicado ao balance), delete reverte
- [ ] **MNT-131** [T][S] Tools (bundle) — cada com playbook detalhada:
  - `add_transaction({ accountId, type, amount, description, categoryId?, occurredAt })` — **playbook crítico**: amount sempre positivo (type diferencia expense/income); confirmar todos os 4 campos essenciais antes; nunca inventar data; sugerir categoria mas confirmar; se cartão, informar o user que a transação entra na próxima fatura
  - `edit_transaction({ id, ...campos })` — playbook: user pode dizer "aquele ifood de ontem era 55 não 45", assistente busca por description+date antes; sempre confirma antes de editar
  - `delete_transaction({ id })`
  - `list_transactions({ filters })` — playbook: nunca retorna tudo; sempre com dateRange (default: mês corrente) e limit (default: 50)

---

## Fase 4 — Transferências

- [ ] **MNT-132** [T][S] `TransferRepository` + use-cases `CreateTransfer({ fromAccountId, toAccountId, amount, description?, occurredAt })`, `ListTransfers(filters)`, `DeleteTransfer({ id })`. Validações: `fromAccountId !== toAccountId`, ambas as contas pertencem ao user, `amount > 0`
- [ ] **MNT-133** [T][S] Ajuste atômico de saldo em ambas contas na mesma tx DB. Delete reverte. Testes: from=to rejeitado; contas de outro user rejeitadas; saldo consistente após operações mistas
- [ ] **MNT-134** [T][S] Tools: `create_transfer`, `list_transfers`, `delete_transfer`. Playbook do create enfatiza: confirmar 3 campos (from, to, amount); avisar que não conta como gasto no dashboard

---

## Fase 5 — Faturas de cartão de crédito

- [ ] **MNT-135** [T][S] Entity `credit_card_invoices` já criada em MNT-122. Adicionar `InvoiceRepository` + status enum (`open` / `closed` / `paid` / `overdue`). Regra: cartão só tem 1 invoice `open` por vez; N `closed`, N `paid`, N `overdue`
- [ ] **MNT-136** [T][S] `CreditCardCycleService` — `resolveInvoiceForDate(accountId, date): Invoice`:
  - Dado data e conta cartão, calcula qual ciclo essa data cai (baseado em `close_day`)
  - Se invoice desse ciclo já existe, retorna. Se não, cria com `status='open'` e boundaries corretas
  - `cycle_start` = dia seguinte ao último close; `cycle_end` = próximo close; `due_date` = próximo `due_day` após close
  - Testes edge case: mês com 30 vs 31 dias, fevereiro, close_day > último dia do mês (usa último dia como fallback)
- [ ] **MNT-137** [T][S] Integração com transactions — quando `AddTransaction` recebe conta que tem `credit_limit`, chama `CreditCardCycleService.resolveInvoiceForDate(accountId, occurredAt)` e amarra `transaction.invoice_id`. Delete/edit atualiza `invoice.total_amount` da(s) invoice(s) afetada(s)
- [ ] **MNT-138** [T][S] Worker/scheduler diário (job simples com `@nestjs/schedule` `Cron('0 3 * * *')`):
  - Fecha invoices cujo `cycle_end` foi ontem — marca `status='closed'`, congela `total_amount`
  - Marca `overdue` invoices `closed` cujo `due_date` passou sem `paid_at`
  - Idempotente (roda 2x no mesmo dia sem duplicar efeito)
- [ ] **MNT-139** [T][S] Detecção automática de pagamento de fatura: quando `CreateTransfer` é chamado com `to_account_id` sendo cartão E `amount` matches valor de invoice `closed` não paga, marca essa invoice `paid` + salva `paid_via_transfer_id`. Se o valor não match exato, transfer é criado normal mas invoice fica `closed` — user precisa pagar/informar manualmente via tool
- [ ] **MNT-140** [T][S] Tools (bundle): `get_current_invoice({ accountId })`, `list_invoices({ accountId, status? })`, `pay_invoice({ invoiceId, fromAccountId })` (cria transfer + marca paid), `mark_invoice_paid({ invoiceId })` (fallback manual). Playbook de `get_current_invoice` enfatiza que assistente use isso pra responder "quanto tô devendo no cartão?" ou "quando fecha minha fatura?"

---

## Fase 6 — UI

- [ ] **MNT-141** [T][S] Página `/transactions` (MNT-102 do 007-ui-shell) — lista virtualizada + filtros + FAB. Row de transaction em cartão mostra badge "Fatura {mês}" pequeno. Click em row abre `<TransactionDetail>` sheet
- [ ] **MNT-142** [T][S] Página `/banks` (MNT-103) — grid de cards. Cartão de crédito tem card com layout diferente: mostra "fatura atual: R$X | fecha em N dias | vencimento: DD/MM". Click abre `/banks/:id` com extrato daquela conta
- [ ] **MNT-143** [T][S] Dashboard (`MNT-100`): quando user tem cartão, KPI card "Fatura atual" no topo (só o cartão de mais gasto, ou soma se múltiplos). Botão "pagar" navega pra `/invoices/:id`
- [ ] **MNT-144** [T][S] Página `/invoices/:id` — detail da fatura: lista das transactions daquele ciclo (readonly), total, cycle_start/end, due_date, status. Botão "pagar fatura" abre modal pra escolher `fromAccountId` (contas não-cartão do user) e confirma
- [ ] **MNT-145** [T][S] Histórico de faturas em `/banks/:id` (se conta é cartão) — lista das últimas N invoices `closed` / `paid` / `overdue` com badge de status

---

## Fase 7 — Segurança e integração

- [ ] **MNT-146** [SEC] Ownership checks universais — todos os use-cases usam `AssistantContext.userId` da sessão; testes validam que payload com `accountId` de outro user falha; injection defense em `ListTransactions` (todos os filtros parametrizados via TypeORM, nunca raw SQL)
- [ ] **MNT-147** [T][S] Golden test integrado end-to-end — fluxo real: adicionar cartão → 5 compras → esperar close_day → confirmar invoice fechada + total certo → criar transfer da conta corrente → invoice marcada paid. Reproduz o journey completo pra garantir que todas as camadas conversam certo
- [ ] **MNT-148** [SEC] PII scrubbing na resposta do assistente — antes de mandar texto pro ElevenLabs TTS, regex remove valores estranhos: CPF/CNPJ (raro mas possível se user disser), números de cartão (nunca deve aparecer, defesa em profundidade). Log das ocorrências pra auditoria

---

## Fora de escopo (V1)

- Split de transação entre contas (ex: R$100 no jantar, R$50 seu R$50 amigo) — DEFERRED
- Recorrência de transação (não confundir com `recurring_rules` da Fase 6 do brief) — DEFERRED
- Anexos (foto do recibo, PDF do boleto) — DEFERRED
- Notificações antes do vencimento da fatura — DEFERRED (spec de notifications virá em algum momento)
- Fatura com mais de uma moeda (Wise, Nomad) — DEFERRED
- Parcelamento (uma compra de R$1200 em 12x) — DEFERRED, provavelmente vale um mini-spec próprio depois
- Estorno / crédito na fatura — DEFERRED

## Referências

- [Product Brief](../000-product-brief/spec.md) — modelo de dados financeiro
- [Auth spec](../002-auth/tasks.md) — ownership context
- [Assistant spec](../003-assistant/tasks.md) — ToolRegistry, playbooks
- [UI shell spec](../007-ui-shell/tasks.md) — onde as páginas aterrissam
- @nestjs/schedule — https://docs.nestjs.com/techniques/task-scheduling (pro job de fechamento de invoice)
