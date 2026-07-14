# Consultoria financeira e simulação (MNT-165 … MNT-171)

## Decisões (inline)

- **Filosofia**: backend expõe **tools analíticas** (data → números). LLM (via tools + playbook) traduz números em conselho natural. Zero "template de conselho" em código — o LLM manda no tom
- **Baseline**: cálculos usam janela rolling de **3 meses** por padrão (configurable). Se user tem <2 meses de dados, tools retornam `insufficient_history` — assistente avisa que ainda tá aprendendo o padrão
- **Projeção**: usa `recurring_rules` ativas + média de despesas variáveis dos últimos 3 meses. Não é ML, é aritmética simples e explicável
- **Simulação de compra** considera: saldo atual + rendas previstas até data-alvo - despesas fixas + variáveis médias - compra hipotética. Se cartão + parcelamento, distribui impacto nos meses respectivos
- **Sem conselhos absolutos** — LLM sempre diz "considerando seu histórico X, esse gasto Y..." (evita "você deveria" que soa autoritário)

## Depende de

| Item | Spec | Necessário pra |
|------|------|----------------|
| Módulo transactions completo | 004-transactions | Fonte dos dados históricos |
| Módulo recurring completo | 005-recurring | Projeções futuras usam rules ativas |
| ChartQueryBuilder (MNT-74) | 006-visualizations | Reuso pra reagrupar dados |
| ToolRegistry + playbooks | 003-assistant | Registro das tools novas |
| Fatura de cartão (MNT-135..140) | 004-transactions Fase 5 | Simulação com parcelamento considera impacto na fatura |

## Convenções

Mesmas do resto dos specs.

---

## Fase 0 — Tools de sumário

- [ ] **MNT-165** [T][S] Use-case + tool `get_monthly_summary({ month, year })`:
  - Retorna `{ totalExpense, totalIncome, savings, breakdown: [{ categoryId, categoryName, amount, pctOfTotal }], transactionCount, invoiceUpcoming: { amount, closeDate } | null }`
  - `breakdown` ordenado desc por amount
  - `invoiceUpcoming` = próxima fatura de cartão a fechar
  - Playbook: usar em respostas a "como tá meu mês?", "resumo desse mês", "quanto gastei em julho"
- [ ] **MNT-166** [T][S] Use-case + tools `get_category_stats({ categoryId, monthsBack? })` e `get_spending_pattern({ categoryId?, monthsBack? })`:
  - `get_category_stats` retorna `{ avg, median, max, min, trend: 'up' | 'down' | 'stable' }` (trend baseado em slope da regressão linear simples nos meses)
  - `get_spending_pattern` retorna time-series `[{ year, month, total }]` — pronto pra virar chart via `create_visualization` se assistente quiser combinar
  - Playbook: "estou gastando mais em X ultimamente?", "qual meu padrão em delivery?"

## Fase 1 — Projeção e simulação

- [ ] **MNT-167** [T][S] Use-case + tool `get_projected_balance({ months })`:
  - Projeta saldo total (soma de todas as contas) mês a mês pelos próximos N meses (default 3)
  - Cálculo por mês: `saldoAnterior + (rendas fixas + rendas variáveis médias) - (despesas fixas + despesas variáveis médias) - (parcelas comprometidas que caem no mês)`
  - Retorna `[{ year, month, expectedBalance, expectedIncome, expectedExpense, notes: string[] }]`
  - `notes` sinaliza eventos: "fatura Nubank fecha", "seguro anual em julho", etc
  - Se histórico < 2 meses: usa apenas recurring rules ativas e ignora "médias de variável", note explícita
- [ ] **MNT-168** [T][S] Use-case + tool `simulate_purchase({ amount, categoryId?, occurredAt?, installments? })`:
  - Aplica a compra hipotética sobre `get_projected_balance` (MNT-167)
  - Se `installments > 1` e conta é cartão: distribui `amount / installments` nos N meses seguintes, cada um caindo na fatura respectiva (usa `CreditCardCycleService` de MNT-136)
  - Se conta corrente: subtrai `amount` na data `occurredAt`
  - Retorna `{ scenarioWithout: [...projection], scenarioWith: [...projection], deltaSummary: { minBalance, negativeMonths: [{ year, month }], categoryImpact: { pctVsAverage } }, warnings: string[] }`
  - `warnings` exemplos: "vai negativar em setembro", "supera média da categoria em 40%", "esse valor equivale a 20% do seu salário mensal"
  - Playbook **crítico**: use quando user pergunta "posso comprar X?", "vai caber X?", "se eu comprar Y em 10x o que acontece?"; SEMPRE apresente o cenário completo (with vs without), não só um veredito binário; ofereça alternativas ("dividir em mais parcelas caberia melhor?")

## Fase 2 — Insights ativos

- [ ] **MNT-169** [T][S] Use-case + tool `list_top_spending({ month?, year?, limit? })` — top N transactions do período por valor. Playbook: "onde tô gastando mais?", "quais foram meus maiores gastos"
- [ ] **MNT-170** [T][S] Snippet `prompts/advisory.ts` composto no system prompt (MNT-62 na 003-assistant):
  - Regras: (a) sempre usa tool antes de aconselhar — nunca chuta; (b) tom explicativo, sem "você deveria"; (c) apresenta números concretos ("nos últimos 3 meses sua média foi R$X") antes da opinião; (d) se sugerir cortar gasto, dê alternativas específicas do histórico ("no mês passado você gastou R$50 menos em delivery, dá pra fazer parecido")
  - Restrições: NUNCA dá conselho de investimento específico (regulatório — pode falar de conceitos gerais, não recomendar produto). NUNCA promete ganho futuro. Sempre "considerando seu histórico"

## Fase 3 — UI

- [ ] **MNT-171** [T][S] Card "Insight do mês" no dashboard (MNT-100 do 009-ui-shell): pull automático ao carregar, chama backend endpoint `GET /advisory/insights` que retorna 1-2 insights notáveis (ex: "gastou R$300 a mais em Alimentação vs média dos últimos 3 meses"; "seu saldo projetado pra setembro tá R$800 abaixo da média"). Backend usa mesmas tools internamente. Cada insight tem botão "explicar mais" que abre chat com contexto

---

## Fora de escopo (V1)

- **Recomendação de produto financeiro** (banco X, cartão Y, investimento Z) — DEFERRED e talvez nunca por questão regulatória
- Machine learning pra predição — DEFERRED, aritmética + LLM já resolve 90%
- Categorização automática de transactions ("iFood" auto-marca como Alimentação) — DEFERRED, exige seed grande de regras ou modelo
- Metas de gasto por categoria com bloqueio ("me impede de gastar mais que R$500 em Alimentação") — DEFERRED, entra em spec de budgets futuro
- Comparativos com "média de outros users" — DEFERRED, exige multi-tenant + anonimização, fora do escopo single-tenant do V1
- Cenários "what-if" além de simulate_purchase (ex: "e se meu salário aumentasse 20%?") — DEFERRED, complexidade alta pra frequência baixa

## Referências

- [Product Brief](../000-product-brief/spec.md) — requisito #4 "Consultoria financeira"
- [Transactions spec](../004-transactions/tasks.md) — dados históricos + `CreditCardCycleService`
- [Recurring spec](../005-recurring/tasks.md) — base pra projeção
- [Visualizations spec](../006-visualizations/tasks.md) — assistente pode combinar advisory tools com `create_visualization` pra mostrar projeção em chart
