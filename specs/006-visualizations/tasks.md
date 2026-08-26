# Visualizações dinâmicas — backend (MNT-73..75, MNT-78..79, MNT-88..90, MNT-92)

> UI (MNT-72 chart shadcn, MNT-76 `<DynamicChart>`, MNT-77 integração no chat, MNT-91 `/charts`) migrada pra `specs/009-ui-shell/tasks.md`.

## Decisões (inline)

- **UI kit**: **shadcn/ui** (init em MNT-71 no `specs/009-ui-shell`) — usa o `<Chart>` do shadcn, que é wrapper de **Recharts**. Ganhamos tema/dark mode automático + tooltip customizado alinhado com o resto da UI
- **Padrão LLM ↔ dados**: LLM preenche schema estruturado (`ChartSpec`, Zod-validado), backend traduz pra chamada Prisma tipada (Client API `findMany`/`groupBy`/`aggregate`; `$queryRaw` só onde a API estruturada não cobre, sempre parametrizado). **Zero SQL do LLM, zero código do LLM, zero shell.**
- **Segurança**:
  - `userId` **sempre** vem do contexto de auth da sessão (nunca do payload da tool)
  - Só campos do **whitelist** do schema entram na query
  - Cap de rows configurável (default 100) — se ultrapassar, backend re-agrega automaticamente pra granularidade maior (dia→semana→mês)
  - Timeout de 5s por query; erro estruturado se ultrapassar
- **Tipos de gráfico suportados no V1**: `bar`, `stacked-bar`, `line`, `area`, `pie`, `donut`, `scatter`, `heatmap` (calendar)
- **Localização**: formatação BR (`R$ 1.234,56`, `01/06/2026`, semanas começando na segunda)
- **Persistência de gráficos**: `ChartSpec` pode ser salvo em `saved_charts` (tabela dedicada). Assistente sugere salvar quando o gráfico tem valor recorrente. Consulta via tool `run_saved_chart({ id })` reexecuta a query — sempre com dados atuais.
- **Datas relativas em `dateRange`**: além do `{ from, to }` absoluto, o schema aceita um `preset` (`this_month`, `last_month`, `last_3_months`, `last_6_months`, `last_year`, `ytd`, `all_time`) resolvido em runtime pelo `ChartQueryBuilder`. Gráficos salvos com preset se atualizam sozinhos ao longo do tempo (visão "gastos do mês atual" sempre mostra o mês corrente)

## Depende de

| Item | Onde | Necessário pra |
|------|------|----------------|
| ToolRegistry + ToolDispatcher (MNT-52..54) | `specs/003-assistant/tasks.md` Fase 2 | Registrar `create_visualization` (MNT-75) |
| Entidade `Transaction` + schema | `specs/004-transactions/tasks.md` | ChartQueryBuilder (MNT-74) — sem a entidade, não tem campo pra consultar |

Consumidores de UI (`<DynamicChart>` no chat, página `/charts`, componente `chart` do shadcn) vivem em `specs/009-ui-shell/tasks.md` — Fases 4 e 7.

## Convenções

Mesmas do `specs/002-auth/tasks.md` (`[T]`, `[S]`, `[P]`, `[HUMANO]`, `🛑`, `[SEC]`, `[DEFERRED]`).

---

## Fase 0 — Setup

Componente `chart` do shadcn (MNT-72) migrou pra `specs/009-ui-shell/tasks.md` — vive junto com a foundation UI.

---

## Fase 1 — Schema e backend

- [x] **MNT-73** [T][S] ✅ commit `a526448` — `ChartSpec` em Zod (`api/src/finance/charts/domain/schemas/chart-spec.ts` — módulo migrou de `assistant/` pra `finance/charts/` alinhando com agrupamento por domínio). Presets nomeados enxutos (`this_month`, `ytd`, `all_time`) + `rolling { unit, n }` (cap n≤1000) substituem os 7 presets originais — cobre "últimos N dias/meses" arbitrário sem sacrificar whitelist. `tag` cortado do XField/grouping/filter (schema Prisma não tem tabela de tags). `filter.categories/banks` viraram `categoryIds/accountIds/bankIds` UUID pra consistência com `list_transactions`.
  ```ts
  ChartSpec = {
    chartType: 'bar' | 'stacked-bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'heatmap',
    xAxis:   { field: XField, grouping?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'category' | 'bank' | 'tag' },
    yAxis:   { field: 'amount' | 'count', aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' },
    filters: {
      dateRange?:
        | { from: ISODate, to: ISODate }
        | { preset: 'this_month'|'last_month'|'last_3_months'|'last_6_months'|'last_year'|'ytd'|'all_time' },
      transactionTypes?: ('expense'|'income')[],
      categories?: string[],
      banks?: string[],
      tags?: string[],
    },
    title: string,
    seriesLabel?: string,
  }
  ```
  Whitelist estrito de `XField` — só campos permitidos (`date`, `category`, `bank`, `tag`, `transactionType`). `dateRange` é união discriminada: absoluto **ou** preset (necessário pra saved charts que se atualizam sozinhos). Testes rejeitam campo fora do whitelist, agregação inválida por tipo, e preset fora do enum
- [x] **MNT-74** [T][S] ✅ commits `d213353` + `779a812` (re-agregação) + `5b09e4c` (bank) — `ChartQueryBuilder` orquestra 4 strategies (`category`, `transactionType`, `time`, `bank`) via `Record<Grouping, StrategyHandler>` exhaustive. `userId` da sessão injetado em todo `where`. `$transaction` com `SET LOCAL statement_timeout = 5000`. Resolve preset/rolling/absolute em runtime. Re-aggregation automática (day→week→month) quando `rows > 100`. `bank` grouping via `$queryRaw` com 2 joins (`transactions → user_bank_accounts → banks`), agrupado por `(bank.id, bank.name)`, ordenado por value DESC. `buildWhereSql` aceita `alias` opcional (safe: hardcoded, `userId` continua parametrizado). MNT-74 100% fechado.
- [x] **MNT-75** [T][S] ✅ commit `7927ef3` — Tool `create_visualization` (`api/src/agent/tools/charts/create-visualization.tool.ts`) implementa `AssistantTool` (MNT-52), registrada via `@RegisterAssistantTool`. Fluxo: strict Zod parse do input (rejeita `userId` smuggle) → `ChartQueryBuilder.build(spec, ctx.userId, clock.now())` → retorna `{ spec, data, meta }`. `ChartsModule` exporta builder, `ChartsToolsModule` wire no `ToolsModule` global.

---

## Fase 2 — Frontend

`<DynamicChart>` (MNT-76) e integração no `<MessageBubble>` (MNT-77) migraram pra `specs/009-ui-shell/tasks.md`.

**Takeover fullscreen (voice-mode)**: MNT-244 (backend side effect `chartOpen`) + MNT-245 (`<ChartTakeoverOverlay>`) + MNT-246 (socket wiring) vivem em `specs/009-ui-shell/tasks.md`. Enquanto text-mode não existe, MNT-77 (bubble inline) fica DEFERRED — todo `create_visualization` abre takeover.

---

## Fase 3 — Robustez, testes, segurança

- [ ] **MNT-78** [T][P] Golden tests de NL → spec: fixtures em `api/test/fixtures/chart-prompts.json` com pares `{ prompt, expectedSpec }`. Rodadas via LLM mockado (unit — sem custo) e opcional e2e (real, gated por env var). Casos:
  - Feliz: `"gastos por categoria em junho"` → bar / category / sum
  - Explícito: `"pizza dos meus gastos por banco no mês passado"` → pie / bank / sum + filtro dateRange do mês anterior
  - Ambíguo: `"meus gastos"` → default: line / month / sum + últimos 3 meses (documentar default no schema)
  - Impossível: `"gastos quando eu estava em SP"` → erro `field_not_allowed: location` (não existe no schema)
- [x] **MNT-79** [SEC] ✅ commit `dc2e44e` — Suite `test/finance/charts/security.spec.ts` com 13 invariantes agrupados por domínio: (1) `userId` só da sessão (Zod strict rejeita payload, tool rejeita smuggle, builder sempre escreve `ctx.userId`); (2) whitelist enforcement em 7 pontos (`chartType`/`xAxis.field`/`xAxis.grouping`/`yAxis.aggregation`/`transactionTypes`/`preset`/top-level unknown); (3) SQL injection resistance (Zod UUID rejeita não-UUID, Prisma parametriza arrays); (4) `SET LOCAL statement_timeout = 5000` dentro do `$transaction` **antes** de qualquer query (via `invocationCallOrder`); (5) `bank` grouping estora erro controlado. Re-agregação em cap fica pendente até MNT-74b implementar.

---

---

## Fase 4 — Saved charts (persistir e reexecutar)

Assistente sugere salvar quando o gráfico tem valor recorrente ("Quer salvar esse gráfico pra consultar depois?"). User acessa depois via chat ("mostra meu gráfico de gastos por categoria salvo") ou UI (`/charts`, MNT-91 em `specs/009-ui-shell/tasks.md`).

- [x] **MNT-88** [T][S] ✅ commit `20719b0` — model `SavedChart` (JSONB `spec` + `pinned` + índice composto `(user_id, pinned DESC, updated_at DESC)`) + `User.savedCharts` relation. Port `SavedChartsRepository` com 6 métodos (add, findById, listSummaries, rename, togglePin, delete). **`lastViewedAt` removido** (YAGNI — sem consumer). **`prisma-json-types-generator`** instalado — Prisma tipa `SavedChart.spec` como `ChartSpec` direto via namespace `PrismaJson`, repo fica idêntico ao pattern do projeto (zero cast, zero helper, zero parse). Namespace em `api/src/types/prisma-json.d.ts`. Migration a rodar via `prisma migrate dev` quando Postgres up.
- [x] **MNT-89** [T][S] ✅ commit `fbf4767` — 6 tools assistente cobrindo CRUD completo dos saved charts (`save_chart`, `list_saved_charts`, `run_saved_chart`, `rename_saved_chart`, `delete_saved_chart`, `toggle_pin_saved_chart`). Todas com `@RegisterAssistantTool` + strict Zod (rejeita userId smuggle). `run_saved_chart` retorna mesmo shape do `create_visualization` + emite `chart.open` side effect (overlay abre sem código FE novo). `SavedChartNotFoundError` traduzido pra `not_found` opaco (não vaza cross-user). `list_saved_charts` retorna full spec no summary (consumer pega `.spec.chartType`). Registradas no `ChartsToolsModule`. `last_viewed_at` removido (YAGNI).
- [x] **MNT-90** [T][S] ✅ commit `4673ef9` — `CHART_FOLLOW_UP_SNIPPET` em `src/agent/domain/prompts/chart-follow-up.ts` injetado no `core` do `composeSystemPrompt` (sempre presente, alongside BASE/LANGUAGE/TREATMENT — não vive em `treatment/*` como o spec original sugeria porque é regra de comportamento, não estilo de fala). Instrui sugerir salvar depois de `create_visualization` com nome intent-oriented, **NUNCA** chamar `save_chart` sem "yes" explícito, pular one-off diagnostic, e resolver `list_saved_charts` → `run_saved_chart` (nunca chutar id). Golden tests asserts literais de: (1) presença em todo treatment style, (2) presença em dashboardTour/onboarding, (3) regra "NEVER call save_chart without an explicit yes", (4) menção do fluxo `list_saved_charts`/`run_saved_chart`.
- [x] **MNT-92** [SEC] ✅ commit `d457dc7` — Suite `test/finance/charts/saved-charts-security.spec.ts` com 17 asserções em 5 grupos: (1) userId da sessão sempre (`save`/`list`/`run` passam `ctx.userId`, strict rejeita smuggle), (2) cross-user access retorna `not_found` opaco nos 4 tools (`run`/`rename`/`delete`/`toggle_pin`) via `it.each`, (3) `save` reforça whitelist (xAxis.field/chartType/top-level unknown), (4) name sanitization (empty, whitespace, >100 chars, `rename` idem), (5) **defense in depth**: `run_saved_chart` re-parseia spec do banco via `chartSpecSchema.safeParse` antes de executar — se DB devolveu lixo, retorna `spec_corrupted` opaco (fix da regressão introduzida pelo generator).

---

## Fora de escopo (V1)

- Gráficos com múltiplas séries além de `stacked-bar` (multi-line, dual-axis) — DEFERRED
- Drill-down (clicar numa barra e navegar pra outro gráfico) — DEFERRED
- Export do gráfico (PNG, PDF, CSV) — DEFERRED
- Dashboards compostos (arrastar múltiplos saved charts numa mesma tela custom) — DEFERRED
- Compartilhamento de saved chart com outros users — DEFERRED (fora do modelo single-tenant)

## Referências

- shadcn charts: https://ui.shadcn.com/charts
- Recharts docs: https://recharts.org
- Zod: https://zod.dev
- Prisma Client CRUD: https://www.prisma.io/docs/orm/prisma-client/queries/crud
- Prisma aggregation/groupBy: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing
