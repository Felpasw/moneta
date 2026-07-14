# Regras recorrentes (MNT-158 … MNT-164)

## Decisões (inline)

- **Escopo**: salário fixo, salário variável (com override mensal), despesa fixa. Cada uma é uma `recurring_rule` — template pra materializar transactions rapidamente
- **Sem job automático**: rules **não** materializam sozinhas em background. User/assistente dispara via tool `apply_recurring_rule({ id, month?, year? })`. Motivos: (a) sem edge cases de fev/feriado/dia inexistente, (b) sem infra de scheduler, (c) user sempre no controle
- **Fixed vs Variable**: `kind='fixed'` usa `default_amount` (salário CLT sem variação, aluguel); `kind='variable'` procura em `recurring_overrides` do mês (freela, comissão). Se `variable` e sem override → assistente pergunta o valor antes de materializar
- **Materialização é idempotente por (rule_id, year, month)** — chamar duas vezes no mesmo mês não duplica. Retorna a transaction existente

## Depende de

| Item | Spec | Necessário pra |
|------|------|----------------|
| Auth Fase 1 | 002-auth | Ownership |
| ToolRegistry + Dispatcher | 003-assistant Fase 2 | Registrar tools |
| Módulos accounts + categories + transactions | 004-transactions Fases 1-3 | `recurring_rule.account_id` FK, `category_id` FK, materialização cria `transaction` |
| Balance auto-update (MNT-130) | 004-transactions Fase 3 | Materialização usa mesmo pipeline pra ajustar saldo |
| UI shell + `/recurring` page (MNT-104) | 009-ui-shell | Onde a UI aterrissa |

## Convenções

Mesmas do resto dos specs.

---

## Fase 0 — Schema + módulo

- [ ] **MNT-158** [T][S] Migration `recurring`: cria `recurring_rules` (id, user_id FK, type ENUM 'income'|'expense', kind ENUM 'fixed'|'variable', name, account_id FK, category_id nullable FK, default_amount nullable — obrigatório se fixed, start_date, end_date nullable, active bool, created_at, updated_at) e `recurring_overrides` (id, rule_id FK, period_year, period_month, amount, created_at, unique(rule_id, year, month)). Check constraint: `kind='fixed' → default_amount NOT NULL`. Módulo `recurring/` (Clean Arch)

## Fase 1 — CRUD + use-cases

- [ ] **MNT-159** [T][S] `RecurringRuleRepository` + use-cases `ListRecurringRules({ userId, type?, active? })`, `CreateRecurringRule({ ... })`, `UpdateRecurringRule({ id, ... })`, `DeleteRecurringRule({ id })`, `ToggleActive({ id })`. Endpoints REST. Ownership via `userId` da sessão
- [ ] **MNT-160** [T][S] Use-case `ApplyRecurringRule({ ruleId, month?, year? })`:
  - Default month/year = corrente
  - Se `kind='fixed'`: usa `default_amount`
  - Se `kind='variable'`: procura `recurring_overrides(rule_id, year, month)` — se não existe, retorna erro `{ error: 'variable_amount_missing', ruleId, year, month }` pra assistente saber que precisa perguntar
  - Idempotente: se já existe `transaction` com `source='recurring'` + `recurring_id=ruleId` + `occurred_at` no mês do (year, month) → retorna a existente sem duplicar
  - Cria a transaction via `AddTransaction` use-case (reaproveita MNT-129/130 — balance auto-update grátis, invoice_id resolvido se cartão)
- [ ] **MNT-161** [T][S] Use-case `SetVariableAmount({ ruleId, year, month, amount })` — upsert em `recurring_overrides` (INSERT ... ON CONFLICT UPDATE). Só faz sentido pra rules `kind='variable'` — retorna erro se rule é fixed

## Fase 2 — Tools do assistente

- [ ] **MNT-162** [T][S] Tools (bundle) — cada com playbook inline:
  - `list_recurring_rules({ type?, active? })` — retorna lista
  - `create_recurring_rule({ type, kind, name, accountId, categoryId?, defaultAmount?, startDate, endDate? })` — playbook enfatiza: confirme todos os campos; se `kind='fixed'`, `defaultAmount` obrigatório; se `variable`, orientar user que o valor do mês virá depois
  - `update_recurring_rule({ id, ...fields })`, `delete_recurring_rule({ id })`, `toggle_active({ id })`
  - `apply_recurring_rule({ ruleId, month?, year? })` — playbook: use quando user diz "registra meu salário desse mês" ou "aplica o aluguel"; se retornar `variable_amount_missing`, PERGUNTE o valor e chame `set_variable_amount` antes de tentar de novo
  - `set_variable_amount({ ruleId, year, month, amount })` — playbook: use pra registrar valores mensais de rules `variable` (salário variável, freela)

## Fase 3 — UI

- [ ] **MNT-163** [T][S] Página `/recurring` (stub em specs/009-ui-shell MNT-104): duas abas **Rendas** e **Despesas fixas**. Cada card: nome, valor (`default_amount` ou "variável"), banco, ativo/inativo, próximo dia esperado. Botão **"aplicar esse mês"** chama `apply_recurring_rule`. Modal "editar/criar" pra CRUD. Botão "+ nova regra" (também redireciona pro chat com prompt)

## Fase 4 — Robustez

- [ ] **MNT-164** [T][P] Golden tests de conversação: (a) onboarding pergunta salário → user responde "R$5000 CLT" → assistente chama `create_recurring_rule` com args certos; (b) user diz "recebi meu freela desse mês, R$3200" numa rule variable → assistente chama `set_variable_amount` + `apply_recurring_rule` em sequência; (c) user diz "aluguel desse mês" → rule fixed encontrada, `apply_recurring_rule` invocada; (d) `apply` chamado 2x no mesmo mês não duplica

---

## Fora de escopo (V1)

- Auto-post por dia agendado (job diário que cria transactions no `expected_day_of_month`) — DEFERRED. Se sentir falta, adicionar campo `expected_day_of_month INT nullable` + worker específico
- Recurring com frequência não-mensal (semanal, bi-mensal, anual) — DEFERRED
- Alerta antes do dia esperado ("salário costuma cair dia 5, hoje é 7") — DEFERRED (spec de notifications virá depois)
- Estimativa retroativa (aplicar rules em meses passados sem transactions) — DEFERRED, tem edge cases

## Referências

- [Product Brief](../000-product-brief/spec.md) — modelo `recurring_rules` + `recurring_overrides`
- [Transactions spec](../004-transactions/tasks.md) — reusa `AddTransaction` + balance update
