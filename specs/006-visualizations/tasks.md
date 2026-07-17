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

- [ ] **MNT-73** [T][S] `ChartSpec` em Zod (`api/src/assistant/domain/schemas/chart-spec.ts`):
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
- [ ] **MNT-74** [T][S] `ChartQueryBuilder` (`api/src/assistant/application/services/chart-query-builder.ts`): `build(spec, userId, now): Promise<ChartData>` — spec → chamada Prisma tipada (`findMany`/`groupBy`/`aggregate` da Client API; `$queryRaw` parametrizado só onde a API estruturada não cobre — ex: `date_trunc` custom). Resolve `dateRange.preset` em runtime usando `now` (ex: `last_month` = 1º ao último dia do mês anterior à `now`). Cobre os 8 chartTypes. Timeout 5s (pg `statement_timeout` via `$executeRawUnsafe('SET LOCAL statement_timeout')` dentro de transação, ou middleware que aborta). Re-agregação automática se contagem esperada > cap
- [ ] **MNT-75** [T][S] Tool `create_visualization` (`api/src/assistant/infrastructure/tools/create-visualization.tool.ts`) — implementa interface `AssistantTool` (MNT-52); registrada via `@AssistantTool()`. Fluxo: valida input com Zod → `ChartQueryBuilder.build` → executa → retorna `{ spec, data, meta: { totalRows, aggregatedFrom? } }`. Erro estruturado (`{ error: 'field_not_allowed', field }`) pro LLM entender e reformular pro user

---

## Fase 2 — Frontend

`<DynamicChart>` (MNT-76) e integração no `<MessageBubble>` (MNT-77) migraram pra `specs/009-ui-shell/tasks.md`.

---

## Fase 3 — Robustez, testes, segurança

- [ ] **MNT-78** [T][P] Golden tests de NL → spec: fixtures em `api/test/fixtures/chart-prompts.json` com pares `{ prompt, expectedSpec }`. Rodadas via LLM mockado (unit — sem custo) e opcional e2e (real, gated por env var). Casos:
  - Feliz: `"gastos por categoria em junho"` → bar / category / sum
  - Explícito: `"pizza dos meus gastos por banco no mês passado"` → pie / bank / sum + filtro dateRange do mês anterior
  - Ambíguo: `"meus gastos"` → default: line / month / sum + últimos 3 meses (documentar default no schema)
  - Impossível: `"gastos quando eu estava em SP"` → erro `field_not_allowed: location` (não existe no schema)
- [ ] **MNT-79** [SEC] Suite de segurança: `userId` do payload é ignorado (sempre o da sessão), campos fora do whitelist rejeitados com erro estruturado, queries > cap são re-agregadas (não retornam raw), timeout de 5s não deixa dispatcher pendurado, teste de injeção via `filters.categories: ["'; DROP TABLE..."]` — QueryBuilder trata como parâmetro, não interpola

---

---

## Fase 4 — Saved charts (persistir e reexecutar)

Assistente sugere salvar quando o gráfico tem valor recorrente ("Quer salvar esse gráfico pra consultar depois?"). User acessa depois via chat ("mostra meu gráfico de gastos por categoria salvo") ou UI (`/charts`, MNT-91 em `specs/009-ui-shell/tasks.md`).

- [ ] **MNT-88** [T][S] Entity `saved_charts` + migration:
  - `id UUID PK`
  - `user_id UUID FK → users ON DELETE CASCADE`
  - `name VARCHAR(100) NOT NULL`
  - `spec JSONB NOT NULL` — `ChartSpec` validado no momento do save
  - `pinned BOOLEAN NOT NULL DEFAULT false`
  - `last_viewed_at TIMESTAMPTZ`
  - `created_at, updated_at TIMESTAMPTZ`
  - Índice `(user_id, pinned DESC, updated_at DESC)`
  - `SavedChartRepository` no `infrastructure/`
- [ ] **MNT-89** [T][S] Use-cases + tools (bundle — assinaturas parecidas, mesma auth context):
  - `save_chart({ name, spec })` — valida spec com o Zod da MNT-73 (mesmo schema, reaproveita), insere. Retorna `{ id }`
  - `list_saved_charts()` — retorna `[{ id, name, chartType, pinned, updatedAt }]`, ordenado (pinned first)
  - `run_saved_chart({ id })` — carrega spec, chama `ChartQueryBuilder.build(spec, userId, now())`, executa, retorna `{ spec, data, meta }` — **mesmo shape do `create_visualization`** pra frontend renderizar sem código novo. Atualiza `last_viewed_at`
  - `rename_saved_chart({ id, name })`
  - `delete_saved_chart({ id })`
  - `toggle_pin_saved_chart({ id })`
  - Todas registradas via `@AssistantTool()` (MNT-52)
- [ ] **MNT-90** [T][S] Assistant follow-up: snippet de prompt adicionado em `treatment/*` (composição MNT-62) — "**depois** de executar `create_visualization`, se o gráfico tem valor recorrente óbvio (visão de mês, comparativo temporal, breakdown por categoria/banco), ofereça salvar com sugestão de nome ('Gastos mensais por categoria'). NUNCA salve sem confirmação do user". Golden test garante que assistente não chama `save_chart` sem OK explícito
- [ ] **MNT-92** [SEC] Suite de saved charts: user só vê/edita/deleta os próprios (filtro por `user_id` da sessão), spec salvo passa pelo mesmo whitelist (impede envenenar spec por API direta), `name` sanitizado (max 100 chars, trim, sem HTML)

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
