# Transações, contas, transferências e faturas — backend (MNT-122..140, MNT-146..148, MNT-154..157)

> UI (MNT-141..145: páginas `/transactions`, `/banks`, dashboard KPI, `/invoices/:id`, histórico de faturas) migrada pra `specs/009-ui-shell/tasks.md`.

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
| Postgres + Prisma | 002-auth Fase 0 | Migrations |
| UI shell (MNT-98..99) + shadcn foundation (MNT-71) | 009-ui-shell | Onde montar `/transactions`, `/banks`, `/invoices` |

## Convenções

Mesmas do resto dos specs. Bundle onde faz sentido (várias tools do mesmo domínio num commit só).

---

## Fase 0 — Schema base

- [x] **MNT-122** [T][S] Migration `financial_core`: cria em uma leva `banks` (catálogo global), `user_bank_accounts` (com `close_day`, `due_day`, `credit_limit`, `overdraft_limit`, `nickname NOT NULL`), `categories` (user_id nullable — NULL = default global), `transactions` (com `invoice_id` FK opcional pra amarrar cartão), `transfers`, `credit_card_invoices`. FKs, checks e índices conforme modelo aprovado (ver `specs/000-product-brief/spec.md` — modelo financeiro) ✅ commit `db9652c` (schema only; migration SQL + CHECK constraints ficam pra rodar em ambiente com DB)
- [x] **MNT-123** [T][S] Seed: (a) top ~20 bancos BR com nome, código COMPE, logo_url; (b) categorias default globais (Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Assinaturas, Salário, Investimentos, Outros). Seed roda idempotente (INSERT ... ON CONFLICT DO NOTHING) ✅ commit `db9652c` (logoUrl null nos bancos — assets pendentes)

---

## Fase 1 — Bancos & contas

- [x] **MNT-124** [T][S] Módulo `banks/` (Clean Arch): use-cases `ListBanks` (catálogo público), repository read-only sobre a tabela seedada. Endpoint `GET /banks` ✅ commit `<pendente>` (tool `list_banks` fica em MNT-126)
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

## Fase 5.5 — Parcelamento (compras parceladas no cartão)

Essencial pra V1 — cartão é o meio principal e parcelamento é onipresente no BR. Sem isso, "quanto vou pagar mês que vem?" mente porque ignora parcelas futuras.

**Decisões dessa fase:**
- **Sem juros** por default (parcelas iguais, `total = installments * amount`). Diferenças de arredondamento de centavo vão pra última parcela
- **Cartão só**: `add_installment_purchase` só aceita conta com `credit_limit` (é sinal de que é cartão). Compra parcelada em débito → registra como transação normal
- **Reconhecimento no assistente**: playbook detalhada pra parsing de expressões PT-BR ("Nx de R$", "N vezes de R$", "parcelei em N", "N parcelas de R$", "R$X em N vezes"). Sempre confirma valor total + N parcelas antes de invocar
- **Cancelamento em lote**: 1 tool deleta o grupo inteiro (todas as parcelas + ajusta invoices/saldos)

- [ ] **MNT-154** [T][S] Migration: entity `installment_groups` (`id`, `user_id FK`, `account_id FK`, `total_amount`, `installments_count INT`, `installment_amount`, `description`, `category_id nullable FK`, `purchase_date TIMESTAMPTZ`, `created_at`, `updated_at`). `transactions` ganha colunas nullable `installment_group_id UUID FK` + `installment_number INT` (1..N). Check constraint: se um NOT NULL, ambos NOT NULL. Check adicional: `installments_count >= 2` (parcelamento em 1x = transação normal)
- [ ] **MNT-155** [T][S] Tool `add_installment_purchase({ accountId, totalAmount?, installmentAmount?, installmentsCount, description, categoryId?, occurredAt })` — cria `installment_groups` row + materializa N `transactions` (cada uma com `occurred_at = addMonths(occurredAt, i-1)`, `installment_number=i`, `installment_group_id=group.id`, `invoice_id` resolvido via `CreditCardCycleService` — MNT-136). Descrição de cada transaction fica `"{description} ({i}/{N})"`. **Playbook crítico**: reconhecer expressões PT-BR de parcelamento; confirmar totalAmount + count antes; se juros mencionados, avisar que V1 registra sem juros (soma linear) e perguntar se ok — se não, orientar user a passar valores exatos por parcela via múltiplos `add_transaction`; se conta não tem `credit_limit`, erro claro sugerindo `add_transaction` normal
- [ ] **MNT-156** [T][S] Tool `cancel_installment_purchase({ groupId })` — ownership check, deleta em transação DB atômica: (a) as N transactions do group, (b) ajusta `balance` da conta, (c) ajusta `total_amount` das invoices afetadas, (d) deleta o group. Retorna resumo `{ deletedCount, affectedInvoices, refundedAmount }` pro assistente confirmar
- [ ] **MNT-157** [T][S] `AvailableLimitService` — `calculate(accountId): { totalLimit, currentInvoiceAmount, closedUnpaidAmount, futureCommittedAmount, usedTotal, available }` só pra contas com `credit_limit`. `futureCommittedAmount` = soma das transactions em invoices ainda não existentes ou em invoices `open` com `occurred_at > hoje` (= parcelas futuras). Endpoint `GET /banks/:id/limit-info`. Tool `get_available_limit({ accountId })` pro assistente responder "quanto tenho de limite?". Card do cartão em `/banks` mostra decomposição visual (fatura atual + faturas fechadas + comprometido futuro)

---

## Fase 6 — UI

Tarefas de UI (MNT-141, 142, 143, 144, 145) migraram pra `specs/009-ui-shell/tasks.md`. Contexto de domínio (badge de fatura, layout de cartão de crédito, `<TransactionDetail>`, histórico de invoices) preservado no texto migrado.

---

## Fase 7 — Segurança e integração

- [ ] **MNT-146** [SEC] Ownership checks universais — todos os use-cases usam `AssistantContext.userId` da sessão; testes validam que payload com `accountId` de outro user falha; injection defense em `ListTransactions` (todos os filtros via Prisma Client API tipada; `$queryRaw` só com params validados por Zod — nunca string concatenation)
- [ ] **MNT-147** [T][S] Golden test integrado end-to-end — fluxo real: adicionar cartão → 5 compras → esperar close_day → confirmar invoice fechada + total certo → criar transfer da conta corrente → invoice marcada paid. Reproduz o journey completo pra garantir que todas as camadas conversam certo
- [ ] **MNT-148** [SEC] PII scrubbing na resposta do assistente — antes de mandar texto pro ElevenLabs TTS, regex remove valores estranhos: CPF/CNPJ (raro mas possível se user disser), números de cartão (nunca deve aparecer, defesa em profundidade). Log das ocorrências pra auditoria

---

## Fora de escopo (V1)

- Split de transação entre contas (ex: R$100 no jantar, R$50 seu R$50 amigo) — DEFERRED
- Recorrência de transação (não confundir com `recurring_rules` da Fase 6 do brief) — DEFERRED
- Anexos (foto do recibo, PDF do boleto) — DEFERRED
- Notificações antes do vencimento da fatura — DEFERRED (spec de notifications virá em algum momento)
- Fatura com mais de uma moeda (Wise, Nomad) — DEFERRED
- Parcelamento **com juros calculado automaticamente** (parcelas com valores diferentes por conta de juros) — DEFERRED. V1 cobre parcelamento sem juros (Fase 5.5)
- Estorno / crédito na fatura — DEFERRED

## Referências

- [Product Brief](../000-product-brief/spec.md) — modelo de dados financeiro
- [Auth spec](../002-auth/tasks.md) — ownership context
- [Assistant spec](../003-assistant/tasks.md) — ToolRegistry, playbooks
- [UI shell spec](../009-ui-shell/tasks.md) — onde as páginas aterrissam
- @nestjs/schedule — https://docs.nestjs.com/techniques/task-scheduling (pro job de fechamento de invoice)
