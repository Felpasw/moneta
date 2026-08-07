# UI shell e arquitetura de telas

Casa canônica de **toda UI/frontend** do projeto. Includes:
- MNT-98..MNT-111, MNT-193 (nativos)
- MNT-51, MNT-66 (migradas de 003-assistant — tasks 3D MNT-63/64/67/68/69/70 descartadas com a troca RPM→DiceBear)
- MNT-71, MNT-44 (migradas de 002-auth)
- MNT-141..MNT-145 (migradas de 004-transactions)
- MNT-72, MNT-76..MNT-77, MNT-91 (migradas de 006-visualizations)
- MNT-84, MNT-85 (migradas de 008-onboarding)
- MNT-186, MNT-191 (migradas de 011-notifications)

Referências cruzadas apontam pros specs backend correspondentes.

**Ordem de execução recomendada:** faça **todo o backend** dos specs 002..008, 011 antes de começar as tasks deste spec. UI espera backend, não o contrário. Foundation shadcn (MNT-71, MNT-72) é a única exceção — pode entrar cedo em paralelo pra permitir smoke da estrutura de app.

## Decisões (inline)

- **Chat é primary interaction** — o produto é um assistente conversacional. A UI é construída ao redor disso, não como um formulário-com-chatbot-anexo.
- **Estrutura**: 5 destinos principais (Início / Chat / Transações / Insights / Perfil). Bottom tabs no mobile (Capacitor), sidebar no desktop web. Chat visualmente destacado no centro.
- **Roteamento Next.js App Router com route groups**:
  - `(auth)/` — páginas fora do shell (login, signup, forgot/reset password). Sem nav.
  - `(app)/` — páginas dentro do shell. Layout compartilhado com nav + topbar.
  - `middleware.ts` decide o grupo baseado na sessão.
- **shadcn/ui** como base (MNT-71). Componentes: `Tabs`, `Sheet`, `Card`, `Skeleton`, `Sonner`, `Dialog`, `Dropdown`, `Avatar`, `Button`.
- **Empty states não são opcionais** — toda lista/grid tem um estado vazio explícito com CTA (geralmente "peça pelo chat").
- **Padrão de estrutura e contratos**: `/web` espelha o layout de `../selling-front-master` (referência local ao lado do repo) — mesma organização de pastas e mesmos contratos de camadas. **Única diferença: UI usa `shadcn/ui`, não HeroUI**. Toast via `sonner` (do shadcn) no lugar de `@heroui/toast`. Layout:
  - `/web/src/app/` — App Router com route groups `(auth)/` e `(app)/`, `providers.tsx` (agrupa `QueryClientProvider` + tema + `<Toaster />`) e `layout.tsx` root
  - `/web/src/services/<dominio>.service.ts` — classe `implements I<Dominio>Service`; usa o `api` (axios) singleton; encapsula chamadas HTTP e dispara toast de sucesso/erro
  - `/web/src/services/interfaces/<dominio>.interface.ts` — DTOs de request/response + interface do service
  - `/web/src/hooks/use<Dominio>.ts` — **classe** com um único método `use()` (mesmo estilo dos services) que retorna todos os hooks do domínio de uma vez (`{ profile, login, signup, logout, ... }`). `useQueryClient()` é chamado uma vez só dentro de `use()`, compartilhado por todas as mutations. Interface fica em `hooks/interfaces/use<Dominio>.interface.ts` (ex: `IAuthHooks`, `AuthHooksResult`). Query keys num objeto `<DOMINIO>_QUERY_KEYS` no escopo do módulo (arrays literais com `as const`, não factory function). Instância singleton exportada como `export default new <Dominio>Hooks()`. Usage: `const auth = authHooks.use(); auth.login.mutate({...})`. **Requer** `/* eslint-disable react-hooks/rules-of-hooks */` no topo do arquivo — o lint bane hooks em class (assume "class component"), mas plain TS class não é componente React; chamada acontece durante render em ordem estável, então Rules of Hooks (runtime) segue respeitada. **Contrato**: `use()` chama todos os hooks no topo em ordem fixa, sem `if`/loop
  - `/web/src/components/` — componentes seguindo **Atomic Design**:
    - `atoms/` — peças indivisíveis (shadcn primitives: `Button`, `Input`, `Label`, `Card`, `Meter`, `Dialog`, ...). `components.json` aponta o alias `ui` pra cá, então `shadcn add` cai aqui automaticamente
    - `molecules/` — composições pequenas de atoms com responsabilidade única, sem side-effect global (ex: `PasswordStrengthMeter` = `Input` + `Meter`, `FormField` = `Label` + `Input` + erro)
    - `organisms/` — composições grandes que **conhecem domínio** e/ou consomem hooks de dados (ex: `LoginForm` consumindo `useLogin`, `TransactionList` consumindo `useTransactions`)
    - `templates/` — esqueletos de layout que recebem `children` (ex: `AuthLayout`, `AppShell`). No App Router, muitas vezes o próprio `layout.tsx` do route group já é template — só sobe pra cá quando reutilizado
  - `/web/src/lib/queryClient.ts` — `QueryClient` configurado (retry só em 5xx/408, `staleTime` 30s, `refetchOnWindowFocus: false`)
  - `/web/src/utils/` — helpers puros (`errorHandler`, `formatters`, `userManager`)
  - `/web/src/types/` — types globais
  - `/web/src/config/` — config (fontes, etc)
  - `/web/src/api.ts` — instância `axios` com `withCredentials: true` + interceptor de resposta pra 401/419
  - `/web/src/globals.ts` — `API_URL` e constantes de env
  - `/web/test/` — **mirror do `src/`** com specs isolados (`test/lib/queryClient.spec.ts` testa `src/lib/queryClient.ts`). Mesmo padrão do `/api/test/`. Vitest config restringe descoberta a `test/**/*.spec.{ts,tsx}`. Imports usam alias `@/` (não relativo) pra apontar pra produção
  - **Stack complementar**: `axios` + `@tanstack/react-query` + `react-hook-form` + `@hookform/resolvers` (zod). Sem estado global "manual" — TanStack Query é fonte única de verdade pros dados remotos, `userManager` (util) é o único ponto que persiste user localmente
  - **Naming de arquivo**: **todo** componente React (`.tsx` que exporta JSX) usa **PascalCase** — incluindo os vendored pelo shadcn em `src/components/atoms/*` (ex: `Button.tsx`, `DropdownMenu.tsx`, `RadioGroup.tsx`). Módulos/services/hooks/utils (`.ts` sem JSX) usam **camelCase** (ex: `queryClient.ts`, `useAuth.ts`, `userManager.ts`). Services e interfaces com escopo de domínio no filename usam ponto (`auth.service.ts`, `auth.interface.ts`). Next.js special files (`layout.tsx`, `page.tsx`, `middleware.ts`, `globals.css`) seguem o padrão do framework. **Atenção**: `shadcn add` cria arquivos em kebab-case por default — após rodar, renomear pra PascalCase (`git mv`) e ajustar imports internos entre os componentes recém-adicionados
  - **Export style**: services, utils e hooks singleton usam **`export default` da instância** (ex: `const authService = new AuthService(); export default authService;`). Um export só — sem duplicar em named + default. Types/interfaces + constantes globais do módulo (query keys, enums, mapas de descriptors) vão como named export no mesmo arquivo (`export interface AuthUser`, `export const AUTH_QUERY_KEYS`). Services, utils e hooks são **classes** (não plain object com `let` no escopo de módulo — encapsulação real via `private`)
  - **Data-driven > condicional**: prioriza `Record`/`Map`/array de descriptors + enum sobre cadeias de `if`/`switch` (regra do CLAUDE.md global). Ex: `PasswordStrengthMeter` usa `enum StrengthLevel` + `STRENGTH_DESCRIPTORS: Record<StrengthLevel, ...>` + `SCORE_CHECKS: Array<(pw) => boolean>` + `SCORE_THRESHOLDS: Array<{maxScore, level}>` em vez de encadear `if score <= 1 ... else if score === 2`

## Depende de

Toda a UI listada aqui depende dos backends terminados nos specs abaixo. Bloqueios explícitos:

| Item | Spec backend | Necessário pra |
|------|--------------|----------------|
| Auth JWT + refresh (Fase 1 do 002) | 002-auth | Middleware + rotas protegidas |
| `POST /auth/signup` + `POST /auth/login` (MNT-13) | 002-auth | MNT-193 (páginas login/signup) |
| `POST /auth/forgot` + `POST /auth/reset` (MNT-36) | 002-auth | MNT-44 (páginas forgot/reset password) |
| Gateway WS `/agent/ws` (MNT-50) | 003-assistant | MNT-51 (client WS), MNT-101 (`/chat`) |
| CRUD `/agent/profile` (MNT-61) | 003-assistant | MNT-66 (`/settings/assistant`) |
| `GET /agent/voices` (MNT-56) + `POST /agent/voices/:id/preview` (MNT-65) | 003-assistant | MNT-66 (seletor de voz) |
| Tools `create_visualization`/`run_saved_chart` (MNT-75, MNT-89) | 006-visualizations | MNT-76, MNT-77, MNT-91 |
| Tools de transação/banco/fatura (Fase 5 do 004) | 004-transactions | MNT-141..145 |
| Tools de onboarding (MNT-81) + `GET /onboarding/state` (MNT-80) | 008-onboarding | MNT-84 (modal), MNT-85 (dismiss) |
| Backend push (MNT-184, MNT-185, MNT-190) | 011-notifications | MNT-186 (hook), MNT-191 (`/settings/notifications`) |
| DiceBear (`@dicebear/core` + `@dicebear/collection` no bundle) | npm (grátis, MIT) | MNT-66 (seletor de avatar) |

## Convenções

Mesmas do `specs/002-auth/tasks.md`.

---

## Fase 0 — App shell e routing

- [x] **MNT-98** [T][S] ✅ commits `2464cc7` (AppShell + dock + shell layout base) → `a73547f` (agent session movida pro shell, dock reposition, labels EN) → `7350476` (GlobalAssistant organism flutuante) → `5d0d284` (sub-rotas `/dashboard`, `/transactions`, `/accounts`, `/cards`, `/categories`, `/settings` com scaffold + templates). Estrutura App Router: `(auth)/` (MNT-193) + `(app)/(shell)/layout.tsx` montando `AppShell` (dock + `GlobalAssistant` + Providers), pages delegam em templates. Ícones lucide-react. **Divergências vs spec original**:
  - `<AppNav>` implementado como `DockTabs` vendored (magnify motion + SVG glass filter, commits `2464cc7`/`e593960`) em vez de shadcn `Tabs`
  - Dock tem 7 destinos (Home / Transactions / Cards / Accounts / Categories / Settings / Assistant) + Sign out, sem destaque específico pro Chat central — Chat/mic vive como `GlobalAssistant` organism flutuante (avatar + expand pra mic/messages/info), MNT-101 continua pendente
  - Rotas `/cards` e `/categories` criadas fora da spec (ver "Pendências abertas do scaffold" ao fim da Fase 1)
- [ ] **MNT-99** [T][S] `middleware.ts` do Next — lê refresh cookie (MNT-14), decide:
  - Se rota `(auth)` e usuário logado → redirect pra `/` (ou `/onboarding` se `onboarded_at IS NULL`)
  - Se rota `(app)` e não logado → redirect pra `/login?next=<path>`
  - Se logado + não onboarded + rota != `/onboarding` → redirect pra `/onboarding`
  - Chama `GET /onboarding/state` (MNT-80) com cache curto (localStorage flag por sessão) pra evitar N requests

---

## Fase 1 — Páginas do shell

- [ ] **MNT-100** [T][S] Dashboard `/` (aba **Início**):
  - [x] **KPIs + saudação + empty state**: `DashboardScreen` consome `accountsHooks.use()` + `transactionsHooks.use()` (default fetch — sem filters, MNT-141 traz o mês-scoping depois). "Total balance" ← `accountsSummary.totalBalance`; "Recent income/expenses/net" ← `transactionsSummary` (labels honestos até filters landarem — não é "this month" ainda, é "latest transactions"). Saudação `Hi, {user.name ?? "there"}` do `useUserStore`. Empty state via `<EmptyState>` quando `accounts.items.length === 0`. Loading/error herdados dos Next boundaries do `(shell)`. Scalar fields removidos de `DashboardView` (interface) e `MOCK_DASHBOARD_VIEW` (`totalBalance`/`income`/`expense`/`net`) — mock agora só carrega chart data (topCategories/monthlyFlow/balanceChart) até MNT-72/89 landarem. **DashboardScreen.spec** reescrito (spec antigo era pra dashboard de mic/avatar/agent — feature removida) com 4 casos: empty via EmptyState, saudação, KPI Total balance direto do accounts.summary, KPIs income/expense/net direto do transactions.summary.
  - [ ] **Charts + full DashboardView com dados reais** (pendente, bloqueado por **MNT-218** — `GET /dashboard/view` no backend, spec em `004-transactions`). Quando MNT-218 landar: novo `dashboardService.get()` + `useDashboard` hook (Suspense), `DashboardScreen` recompõe as seções (top categories, monthly flow, balance chart) consumindo o payload real, tipos migram de `mocks/finance.ts` pra `services/interfaces/dashboard.interface.ts`, chart components (`MonthlyFlowChart`/`BalanceLineChart`/`TopCategoriesChart`/`ChartCard`) voltam do estado orfão. Backend devolve dados brutos (números/datas); client faz o SVG path das linhas (formatação pura)
  - [ ] Toggle 👁️ mostrar/ocultar saldo persistido em localStorage
  - [ ] KPI "Próxima despesa fixa" (depende de MNT-104 recurring rules) e "Salário previsto" (depende de recurring income rules)
  - [ ] Grid `saved_charts` pinados (top 3, `list_saved_charts?pinned=true` — MNT-89)
  - [ ] FAB fixo bottom-right 🎤 → `/chat` já iniciando gravação
- [ ] **MNT-101** [T][S] Chat `/chat` (aba **Chat**):
  - Header: `<AssistantAvatar>` (MNT-64) + estado (idle/listening/thinking/speaking) + nome do personagem
  - Thread virtualizada de `<MessageBubble>` — cada bubble suporta texto e `<DynamicChart>` inline quando `message.toolResults[i].name === 'create_visualization'` ou `'run_saved_chart'` (MNT-77)
  - Barra inferior: 🎤 push-to-talk (padrão) + toggle 🎧 hands-free contínuo + campo texto (fallback)
  - Botão "novo chat" no header — cria nova `conversation` (memória persiste no Postgres, MNT-58)
  - Session Realtime iniciada via `POST /assistant/session` (MNT-50)
  - Empty state: sugestões de comandos ("registra meu salário", "quanto gastei essa semana?", "gráfico de gastos por categoria")
- [ ] **MNT-102** [T][S] Transações `/transactions` (aba **Grana**):
  - [x] **Backend**: `GET /transactions` estendido de `Transaction[]` → `{ items, summary }`. Port ganhou `TransactionWithEmbeds` (bank+account nickname embedados via `TransactionAccountEmbed = { id, nickname, bankName }`, category via `TransactionCategoryEmbed = { id, name, icon, color } | null`, e `signedAmount` computado a partir de `type + amount`). Repo faz o join num único `findMany` (nested select em `account.bank` + `category`), `toDomainWithEmbeds` computa `signedAmount` inline no mesmo pass da conversão Decimal→number. Use-case `ListTransactionsUseCase` computa summary in-memory dos rows já buscados (`totalIncome`, `totalExpense`, `net = totalIncome - totalExpense`) — mesmo pattern do `computeBanksSummary`. Tool `list_transactions` do agent recebe o shape enriquecido automaticamente; playbook atualizado explicando `items[].signedAmount` (sem recalcular), `items[].account.nickname`, `items[].category?.name`, e `summary.net`/`totalExpense` pra "quanto sobrou"/"quanto gastei" sem soma no agent. Testes novos: repo (embed correto + signedAmount + join no select), use-case (items+summary, empty, net negativo), controller (body shape), tool (wrap `{items, summary}`).
  - [x] **Web infra**: `transactionsService` (list only por enquanto — mutations vêm com MNT-141) + `useTransactions` (classe + `use()` retornando `{ list: UseSuspenseQueryResult }`, `TRANSACTIONS_QUERY_KEYS`). Mesma shape dos outros services/hooks; datas na wire como string (JSON). TDD: 2 casos no service spec (sem filtros + com filtros repassados como query params via axios `{ params }`) + 1 caso no hook spec (Suspense pattern + query key cache).
  - [x] **Web consumer**: `TransactionsScreen` real consumindo `transactionsHooks.use()`. Loading/error via Next boundaries do `(shell)` (MNT-215); empty via `<EmptyState>`. Summary card renderiza `totalIncome`/`totalExpense`/`net` direto do backend. Lista faz **day grouping via render** — backend agora expõe `dayGroupKey: string` (YYYY-MM-DD, UTC, computed no `toDomainWithEmbeds` junto do `signedAmount`) em cada `TransactionWithEmbeds`; frontend só compara `items[idx-1]?.dayGroupKey !== tx.dayGroupKey` (Fragment + guard `&&`), primeiro item sempre mostra header via optional chaining. Zero string op / Date parse no cliente pra decidir o grouping. `TransactionRow` subcomponente pequeno lê `tx.description` (fallback "—"), `tx.category?.name` (fallback "Uncategorized"), `tx.account.nickname`, `tx.signedAmount` direto; icon via `Record<TransactionType, Icon>`. `DIRECTION_ICON`/`ROW_TRANSITION` constantes no escopo de módulo (não recria a cada render). Playbook do tool `list_transactions` menciona `dayGroupKey` (LLM não precisa parsear pra agrupar). Órfãos removidos de `mocks/finance.ts`: `TransactionDirection`, `TransactionRow`, `TransactionGroup`, `TransactionsSummary`, `MOCK_TRANSACTION_GROUPS`, `MOCK_TRANSACTIONS_SUMMARY`, helpers `daysAgo`+`dayKey`. TDD: `TransactionsScreen.spec` (3 casos — empty, populated com fields do embed, summary lido direto).
  - Deferido pra MNT-141 (Fase 6): lista virtualizada (`@tanstack/react-virtual`), filtros (período/banco/categoria/tipo/tag), search debounced, FAB "+" com `<AddTransactionSheet>`, sub-rota `/transactions/:id`
- [ ] **MNT-103** [T][S] Bancos `/banks` (sub-navegação dentro de **Grana**):
  - [x] Grid + summary consumindo `useAccounts()` (Suspense). Backend estendeu `GET /accounts` pra `{ items, summary }` (commit `20b9a2a` / MNT-103) — use-case computa `totalBalance`/`checkingCount`/`totalOverdraft` in-memory dos rows checking-only, tool `list_my_accounts` do agent recebe o novo shape. Cards recebem `UserBankAccountWithBank` direto (sem view-type intermediário), leem `account.bank.name`/`account.balance`/`account.creditLimit`. `BanksScreen` faz early-branch inline via subcomponente local `AccountCard`, sem ternário em JSX. Estados loading/error delegados pros Next boundaries do `(shell)` (commit `84a89ed` / MNT-215); empty via `<EmptyState>` molecule. Órfãos removidos de `mocks/finance.ts`: `BankRow`/`CheckingBankRow`/`CreditBankRow`/`BankKind`/`InvoiceStatus`/`BanksSummary`/`MOCK_BANK_ROWS`/`MOCK_BANKS_SUMMARY`/helper `dayOfMonth`. TDD verde: `BanksScreen.spec` (3 casos — empty, populated, summary lido direto do backend). **Regra estabelecida no processo**: "backend define shape e agregação, frontend consome property-direct" — CLAUDE.md global atualizado com seção nova + memória `feedback_no_frontend_derivation.md`
  - [x] **Invoice section no `CreditAccountCard`** — `UserBankAccountWithBank` do web ganhou `currentInvoice: { totalAmount, status, dueDate, cycleStart, cycleEnd } | null` + `usagePct: number` (mirror do backend MNT-159), `InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue'` como string union. `CreditAccountCard` renderiza condicionalmente: com `currentInvoice` mostra badge de status, "Current statement" com totalAmount, progress bar de `usagePct`, grid Available/Limit/Due date; sem invoice cai no fallback "Credit limit" + "Due day: DD". Guards via `&&` (sem ternário em JSX visível). Fixture `BanksScreen.spec` cobre credit com invoice → renderiza a seção completa (`current statement`, `limit usage`, `50%`, `open` badge)
  - [ ] Botão "+ conta" abre `<AddBankAccountSheet>`
  - [ ] Sub-rota `/banks/:id` — extrato daquela conta (mesma UX de `/transactions` já filtrado)
- [ ] **MNT-104** [T][S] Recurring `/recurring` (sub-navegação dentro de **Grana**):
  - Duas abas: **Rendas** e **Despesas fixas**
  - Lista das `recurring_rules` — cada card: nome, valor (default_amount ou "variável"), banco, ativo/inativo
  - Botão "aplicar esse mês" em cada card → chama tool `apply_recurring_rule` (materializa transação)
  - Sub-rota `/recurring/:id` — edit
- [ ] **MNT-105** [S] Insights `/charts` (aba **Insights**) — **já implementado em MNT-91** (`specs/006-visualizations`). Aqui só entra o link da tab
- [ ] **MNT-106** [T][S] Settings hub `/settings` (aba **Perfil**) — layout com nav lateral (desktop) ou lista clicável (mobile):
  - `/settings/profile` — nickname, name, email, botão "verificar email" (se `email_verified=false`)
  - `/settings/assistant` — implementado em MNT-66 (Fase 3), só entra na nav
  - `/settings/security` — troca de senha, lista de sessions ativas (com botão revogar), passkeys cadastradas (nickname + last_used_at), audit log (últimos 20 eventos)
  - `/settings/data` — botões "Exportar meus dados" (LGPD) e "Deletar conta" (com confirmação dupla)
  - `/settings/about` — versão do app, terms, privacy, licenças

### Pendências abertas do scaffold

`5d0d284` entregou scaffold visual + templates consumindo `src/mocks/finance.ts` (shape backend-ready) pras rotas do shell. **Nenhuma task de Fase 1 fecha só com o scaffold** — cada uma exige service/hook + integração real. Estado por task:

- **MNT-100** `/dashboard` — template com KPI cards (Total balance / Income / Expenses / Left this month), MonthlyFlowChart, BalanceLineChart, TopCategoriesChart (mocks). **Falta**: saudação com `nickname||name`, toggle 👁️ mostrar/ocultar saldo, KPIs corretos (Gastos do mês / Próxima despesa fixa / Salário previsto), grid de saved_charts pinados, FAB 🎤 → `/chat`, empty state, hooks reais (`useAccounts` + `useTransactions` agregados).
- **MNT-102** `/transactions` — template lista agrupada por dia (mock). **Falta**: virtualização, filtros (período/banco/categoria/tipo), search, FAB "+" com `<AddTransactionSheet>`, sub-rota `/transactions/:id`, empty state, hook `useTransactions()`.
- **MNT-103** `/banks` — decisão (a) tomada em `1658901` (unificado). Grid + summary já consomem `useAccounts()` real via Suspense (ver bullet checked no MNT-103 acima). Restam `<AddBankAccountSheet>`, sub-rota `/banks/:id`, e a seção de invoice/usage no `CreditAccountCard` amarrada à MNT-159.
- **MNT-106** `/settings` — apenas `PlaceholderScreen` (título + subtítulo). **Falta**: nav lateral/lista, sub-rotas `/settings/profile`, `/settings/security`, `/settings/data`, `/settings/about`. `/settings/assistant` já existe (MNT-66).
- **`/categories`** — rota criada em `5d0d284` sem task base na spec. Decisão: criar task nova (categorias custom por user já existem no backend, MNT-127) ou dropar a rota e mover CRUD pra dentro de um sheet dispatched pelo chat/`/transactions`.

Bundle sugerido pra integração (padrão MNT-193/MNT-66c): `banksService` + `accountsService` + `useAccounts()` primeiro (destrava MNT-103); depois `transactionsService` + `useTransactions()` (MNT-102 versão simples); depois `invoicesService` + agregação do dashboard (MNT-100). Fase 6 (MNT-141..145) especializa em cima disso.

---

## Fase 2 — Padrões cross-cutting

- [ ] **MNT-107** [T][S] `<EmptyState icon title description action?>` — componente shadcn-style reutilizável. Fixtures de copy pra cada lugar: transactions, banks, recurring, charts, sessions. Sempre com CTA (geralmente redirect pro chat)
- [ ] **MNT-108** [T][S] Loading states — `<Skeleton>` do shadcn em listas/cards; Suspense boundaries em cada page do App Router; `loading.tsx` por rota
- [x] **MNT-109** [S] ✅ commit `4c4ca21` — `<Toaster richColors position="top-right" />` do sonner montado em `web/src/app/Providers.tsx` (root Provider), cobre `(auth)` e `(app)`. Callsites usam `toast.success` / `toast.error` inline (auth forms, `updateProfile` mutation em `/settings/assistant`, mic denied em `AppShell`). **Pendente**: handler central conectado ao WebSocket do assistente pra tool-call success/error automáticos — fica pra MNT-101 (chat) trazer junto.
- [ ] **MNT-110** [T][S] Error boundary — `error.tsx` por segmento do App Router. Fallback com botão "recarregar" e link "reportar bug" (mailto ou form). Envia stack pro Sentry (quando MNT-XX de observabilidade entrar)
- [ ] **MNT-111** [S] Dark mode — shadcn suporta via CSS variables. Toggle no `/settings/profile` (light/dark/system). Persiste em localStorage + cookie (pra SSR não flashar). Detecta `prefers-color-scheme` como default
- [ ] **MNT-216** [T][S] i18n framework pra strings da UI — hoje o shell está todo em EN literal (commit `bf3c71c` traduziu de PT-BR pra EN inline). Objetivo: strings viram chaves resolvidas por locale, user pode alternar via `/settings/profile`, e o par com MNT-217 fecha idioma consistente entre UI e fala do assistente:
  - Adotar **`next-intl`** (App Router first-class, SSR-friendly, TypeScript autocompletar chaves, cobre server + client components sem gambiarra) em vez de `react-i18next` (client-only, ruim com RSC) ou solução caseira
  - Estrutura: `web/src/messages/{en,pt-BR}.json` (namespaces por área: `shell`, `auth`, `settings`, `dashboard`, `banks`, `transactions`, `categories`, `assistant`, `common`)
  - `middleware.ts` (MNT-99) detecta locale: (1) `preferredLocale` do user logado > (2) cookie `NEXT_LOCALE` > (3) `Accept-Language` > (4) fallback `en`
  - `useTranslations("<namespace>")` em client components; `getTranslations()` em server components
  - Migrar callsites atuais em ordem: `AppShell`/`DockTabs` (labels), `AssistantSettings*` (tabs/labels/copies), `LoginForm`/`SignupForm`, `PlaceholderScreen`, `EmptyState` fixtures (MNT-107)
  - **Persistência da preferência**: nova coluna `users.preferred_locale VARCHAR(10) NULL` (ISO tag `en` | `pt-BR`; NULL = detectado). Migration + expõe via `PATCH /users/me` (endpoint novo pequeno) OU embutido no `PATCH /agent/profile` como campo top-level de user (a decidir na task)
  - Toggle no `/settings/profile` (piggyback quando MNT-106 for atacada) e/ou tab novo em `/settings/assistant` (fica próximo de MNT-217, mas semanticamente é preferência do user, não do agent — decidir no ciclo)
  - **Testes**: refatora as 7 falhas atuais em `test/components/**/AssistantSettings*.spec.tsx` — hoje procuram "carregando"/"Tom"/"Voz"/"Avatar" (PT-BR pré-`bf3c71c`); passam a montar com `NextIntlClientProvider` mockando `en` e queries acessíveis por `role`+chave. Baseline pré-i18n vermelho conhecido — MNT-216 desbloqueia
  - Golden: renderiza template `AssistantSettingsScreen` em `en` e `pt-BR`, snapshot difere só em strings, não em estrutura DOM
  - **Cross-ref**: bloqueia MNT-217 (preferência de idioma do agent lê `preferredLocale` como default do `auto` mode)

---

## Fase 3 — Assistente (chat, avatar DiceBear, settings) — migrada de 003-assistant

Tasks originalmente no `specs/003-assistant/tasks.md` que são UI/frontend puro. Vivem aqui por serem componentes/páginas do `/web`. Referências cruzadas pro backend continuam apontando pro spec 003.

> **Nota histórica**: o design original previa avatar 3D humanoid via Ready Player Me (`.glb` + three.js + morph targets + lip sync amplitude-driven). Descartado antes de codar — a proposta virou overkill pro escopo do assistente financeiro e o domínio RPM ficou inacessível na avaliação. Substituído por **DiceBear 2D SVG** com CSS pulse pra feedback de estado. Tasks removidas: **MNT-63** (avatares default RPM), **MNT-64** (`<AssistantAvatar>` three.js), **MNT-67** (wizard RPM iframe), **MNT-68** (`useAudioMouth`), **MNT-69** (three.js internals), **MNT-70** ([DEFERRED] visemas fonéticos).

- [ ] **MNT-51** [T][S] Client WS puro (não precisa lib OpenAI) consumindo `/agent/ws` do MNT-50. Hook `useRealtimeSession()` (ou equivalente Capacitor) — abre WS com JWT no handshake (query `?token=` ou subprotocol `bearer.<token>`), gerencia máquina de estado (`idle` / `listening` / `thinking` / `speaking`), reconecta com backoff, expõe API pra enviar áudio do mic e receber texto/áudio TTS envelopado (`tts.audio.delta` / `tts.audio.done` / `tts.audio.canceled` / `tts.audio.error`). Reencaminha `speech_started` do VAD do usuário pro backend disparar barge-in (MNT-57). Base pra MNT-101 (página `/chat`)
- [x] **MNT-66** [T][S] ✅ commits `2464cc7` (feature) → `1114971` (refactor: separa lógica de UI em hooks/util) → `c1e64fb` (fix: adiciona zustand dep e keyframes ripple-cell órfãs) → `65962c8` (refactor auth: userManager → userStore) → `84dd6d4` (refactor agent: useAgentSession → agentSessionStore + finaliza rename do dashboard) → `33aab65` (feat avatar: expande DiceBear de 6 pra 15 styles) → `2b78546` (fix: adiciona dock-tabs vendored que faltou no 2464cc7) → `203e453` (refactor: AppSidebar consome nameInitials + Link do Next). Página `/settings/assistant` em `(app)/(shell)/settings/assistant/page.tsx` — 3 blocos independentes (`AssistantSettingsTreatmentStyle`, `AssistantSettingsVoice`, `AssistantSettingsAvatar`) persistindo via `PATCH /agent/profile` de forma otimista + toast de sucesso/erro (sonner). Traz junto o `AppShell` com dock flutuante (dock-tabs vendored + `<aside aria-label="User Profile Menu">`) centralizando boot/refresh de sessão e navegação pra todas as rotas autenticadas, atoms `AnimatedRadioGroup` / `RippleLoader` / `TalkingAssistantAvatar`, hooks `useAudioAmplitude` / `useVoiceLevel` / `useVoicePreview`, stores `userStore` / `agentSessionStore` (Zustand), util `dicebearAvatarUrl` unificado e utility `nameInitials`. Detalhes originais preservados abaixo:
  - **(a) `treatmentStyle`** — `RadioGroup` do shadcn com 3 opções (Formal / Informal / Muito informal). Cada opção mostra embaixo um exemplo curto da fala do assistente naquele tom (constantes locais, não vem do backend). Change dispara `PATCH` imediato (otimista via TanStack Query) + toast de sucesso via sonner.
  - **(b) Voz** — grid/lista dos itens de `GET /agent/voices` (MNT-56). Cada card mostra `voice.name` + `voice.language` + botão ▶️ que faz `POST /agent/voices/:voiceId/preview` (MNT-65) e toca o áudio MP3 retornado num `<audio>` inline (single active — clicar outra pausa a anterior). Selecionar dispara `PATCH { voiceId }`.
  - **(c) Avatar DiceBear** — dois controles: (1) `Input` de seed com default = `nickname` do user (fallback: `users.name`) — deixa user personalizar; (2) grid de styles suportados (5-6 curados: `notionists`, `personas`, `lorelei`, `micah`, `avataaars`, `open-peeps`) renderizando cada um com o seed atual pra preview vivo. Selecionar salva `avatarUrl = "dicebear:{style}:{seed}"` via `PATCH`.
  - **Não tem textarea de instruções livres — decisão de segurança já documentada em MNT-61.**
  - Testes: renderização condicional dos exemplos por style + interação de mudança (RadioGroup change dispara mutation) + preview de voz (mock do `<audio>` play) + composição da string `dicebear:*:*`.
- [x] **MNT-66b** [T][S] ✅ commit `5733c85` — Atom `AssistantAvatar` em `web/src/components/atoms/AssistantAvatar.tsx` com props `avatarUrl: string | null`, `state?: 'idle'|'thinking'|'speaking'` (default `idle`), `size?: 'sm'|'md'|'lg'` (default `md`), `fallbackSeed?: string` (default `'user'` — callsite passa `nickname ?? name` do user), `className?: string`. Parse via regex (`/^dicebear:([a-z0-9-]+):([A-Za-z0-9_-]{1,128})$/`) + whitelist dos 6 styles curados (`notionists`, `personas`, `lorelei`, `micah`, `avataaars`, `open-peeps`); qualquer avatarUrl null/inválido/fora da whitelist cai pra `notionists` + `fallbackSeed`. Render usa `new Avatar(styleModule, { seed }).toDataUri()` em `<img>` (SVG inline via data URI — sem HTTP runtime). `useMemo` sobre `(style, seed)` prova via teste que mudança só de `state` não regenera SVG. Classes via `Record` lookup (`STATE_CLASSES`, `SIZE_CLASSES`, `STYLE_MODULES`). **Downgrade `@dicebear/core` 10.3.0 → 9.4.3** — `@dicebear/collection@9` ainda é o único disponível e `personas`+`open-peeps` (v9) quebravam com core@10 por remoção do export `escape`. Suite 59/59, lint zerado (warning `no-img-element` silenciado com WHY: data URI de SVG inline não tem HTTP pra Next otimizar). 12 testes cobrem: parse feliz, 6 styles curados, fallback null/style desconhecido/regex miss, fallbackSeed default `'user'`, classes por state (idle/thinking/speaking), classes por size (sm/md/lg), memoização (só regenera quando (style,seed) muda), merge de `className` customizada
- [x] **MNT-66c** [T][S] ✅ commit `627f233` — Hook `assistantProfileHooks.use()` (classe + `use()` conforme padrão do domínio, `web/src/hooks/useAssistantProfile.ts`) expondo `profile` (query `['agent','profile']` → `GET /agent/profile`), `voices` (query `['agent','voices']` → `GET /agent/voices`, `staleTime: 10min`), `previewVoice` (mutation → `POST /agent/voices/:voiceId/preview`, responseType `arraybuffer` → `Blob(audio/mpeg)`) e `updateProfile` (mutation → `PATCH /agent/profile`, atualiza `queryData` da profile no `onSuccess`). Interface `IAssistantProfileHooks` + `AssistantProfileHooksResult` em `hooks/interfaces/useAssistantProfile.interface.ts`. Service `assistantProfileService` (singleton exportado default, `services/assistantProfile.service.ts`) + interface `IAssistantProfileService` com `AssistantProfile`, `TtsVoice`, `TreatmentStyle` (union `formal|informal|very_informal`), `UpdateProfilePatch`. Testes cobrem: fetch/cache das duas queries, `previewVoice` retornando Blob, `updateProfile` atualizando cache no sucesso e preservando cache no erro (`test/hooks/useAssistantProfile.spec.tsx` + `test/services/assistantProfile.service.spec.ts`). Toast de erro fica no consumer (ainda não wire-up — vem no MNT-66)

---

## Fase 4 — Foundation shadcn/ui — migrada de 002-auth e 006-visualizations

Pré-requisito de toda UI. Precisa acontecer **antes** de qualquer outra task deste spec (exceto documentação).

- [x] **MNT-71** [S] ✅ commit `5aba1ba` — Init shadcn/ui em `/web` (base color neutral, path `@/components`, primitives vivem em `atoms/`); componentes esperados presentes: `Button`, `Input`, `Label`, `Form`, `Dialog`, `RadioGroup`, `Select`, `Card`, `Avatar`, `Tabs` (base-ui), `ScrollArea`, `Sonner`. Uma variante custom animada de Tabs adicionada em `02417fb` (`ui/Tabs.tsx`, consumida pelo `AssistantSettingsScreen`); o primitive shadcn em `atoms/Tabs.tsx` fica pra composição com `Form`. `tailwind.config` + `globals.css` ajustados, build passando.
- [ ] **MNT-72** [S] Adicionar componente `chart` do shadcn: `pnpm dlx shadcn@latest add chart`. Instala Recharts como peer dep, cria `/web/src/components/ui/chart.tsx` com `<ChartContainer>`, `<ChartTooltip>`, `<ChartTooltipContent>`, `<ChartLegend>`, `<ChartLegendContent>` + type `ChartConfig`

---

## Fase 5 — Auth (UI) — migrada de 002-auth

- [x] ✅ commit `7d0bbf5` **MNT-193** [T][S] Páginas `/login` e `/signup` em `/web/src/app/(auth)/` — casca principal da UI. Consomem `POST /auth/login` e `POST /auth/signup` (MNT-13). Segue **integralmente** o padrão descrito em "Decisões" (`services/auth.service.ts` + `services/interfaces/auth.interface.ts` + `hooks/useAuth.ts` com `useLogin`/`useRegister`/`useLogout`/`useGetProfile` via TanStack Query). Form via `react-hook-form` + zod resolver. UI com shadcn (`Card`, `Input`, `Label`, `Button`, `Form`). Toast de erro/sucesso via `sonner`. Link "Esqueci minha senha" já presente (aponta pra `/forgot-password` — página real vem no MNT-44). Redirect pós-sucesso ramificado direto no `useLoginForm` a partir de `user.onboardedAt` (`/` se preenchido, `/onboarding` se `null`); `UserSnapshot` no api ganhou `onboardedAt` pra viabilizar. Signup redireciona incondicional pra `/onboarding`. O middleware do MNT-99 ainda é necessário pra cobrir deep-link/refresh de aba fora do fluxo pós-submit.
- [ ] **MNT-44** [S] Web UI no `/web`: link "Esqueci minha senha" na tela de login; página `/forgot-password` com input de email e mensagem neutra pós-submit; página `/reset-password?token=...` com form de nova senha + confirmação. Consome `POST /auth/forgot` e `POST /auth/reset` (MNT-36 no `specs/002-auth`)

---

## Fase 6 — Transactions (UI) — migrada de 004-transactions

Especializa as páginas abstratas do shell (MNT-100/102/103) com detalhes de domínio de transações e faturas.

- [ ] **MNT-141** [T][S] Página `/transactions` (MNT-102) — lista virtualizada + filtros + FAB. Row de transaction em cartão mostra badge "Fatura {mês}" pequeno. Click em row abre `<TransactionDetail>` sheet
- [ ] **MNT-142** [T][S] Página `/banks` (MNT-103) — grid de cards. Cartão de crédito tem card com layout diferente: mostra "fatura atual: R$X | fecha em N dias | vencimento: DD/MM". Click abre `/banks/:id` com extrato daquela conta
- [ ] **MNT-143** [T][S] Dashboard (MNT-100): quando user tem cartão, KPI card "Fatura atual" no topo (só o cartão de mais gasto, ou soma se múltiplos). Botão "pagar" navega pra `/invoices/:id`
- [ ] **MNT-144** [T][S] Página `/invoices/:id` — detail da fatura: lista das transactions daquele ciclo (readonly), total, cycle_start/end, due_date, status. Botão "pagar fatura" abre modal pra escolher `fromAccountId` (contas não-cartão do user) e confirma
- [ ] **MNT-145** [T][S] Histórico de faturas em `/banks/:id` (se conta é cartão) — lista das últimas N invoices `closed` / `paid` / `overdue` com badge de status

---

## Fase 7 — Visualizations (UI) — migrada de 006-visualizations

- [ ] **MNT-76** [T][S] `<DynamicChart spec data />` (`/web/src/components/dynamic-chart.tsx`):
  - `switch (spec.chartType)` — delega pro componente Recharts wrappado pelo shadcn (`BarChart`, `LineChart`, `PieChart`, etc)
  - Formatação BR de eixos (currency, date, número), via `Intl.NumberFormat('pt-BR')` e `date-fns/locale/pt-BR`
  - `ChartConfig` gerado a partir do `spec.title` + `spec.seriesLabel` + palette do design system
  - Placeholder quando `data.length === 0`
- [ ] **MNT-77** [T][S] Integração no chat: `<MessageBubble>` do assistente renderiza `<DynamicChart>` inline quando `message.toolResults[i].name === 'create_visualization'`. Áudio TTS toca em paralelo com a renderização. Chart tem `<Card>` do shadcn envolvendo, com botão "expandir" pra full-screen (opcional)
- [ ] **MNT-91** [T][S] Página `/charts` — grid de saved charts (usa `list_saved_charts`); cada card mostra thumb + nome + botões pin/rename/delete/open-in-chat. Click no card abre modal fullscreen com `<DynamicChart>` (chama `run_saved_chart`). "Open in chat" abre nova conversa com contexto ("O usuário quer perguntar sobre o gráfico X salvo — spec: ...")

---

## Fase 8 — Onboarding (UI) — migrada de 008-onboarding

- [x] ✅ commit `c376c93` **MNT-84** [T][S] Página `/onboarding` (server component que delega pro `OnboardingHero` organism). Hook `useAgentSession({ enabled })` — conecta WS `/agent/ws?token=<jwt>`, buffera chunks base64 dos envelopes `tts.audio.delta` em `Uint8Array[]`, monta `Blob(audio/mpeg)` no `.done` e toca via `HTMLAudioElement`. Estado tipado em enum `AgentSessionStatus` (idle/connecting/listening/speaking/error) + flag `isWarming` pra ocultar loader após 1º `audio.onplay`. `OnboardingHero` renderiza VoiceOrb + título + subtítulo + `<BarLoader>` com fadeIn hierárquico via motion (mesmos variants do login/signup); passa `audioElement` pro VoiceOrb que reage via AnalyserNode/uniform `hover` no shader. Novo atom `BarLoader` (8 barras `bg-foreground` animadas, theme-aware). VoiceOrb ganha paleta monocromática (`baseColor1/2/3` em escala de cinza). Ainda **sem** consulta a `GET /onboarding/state` (MNT-80 pendente) — condicionalidade "abre onboarding" é feita direto no `useLoginForm` via `user.onboardedAt` do MNT-193. Middleware do MNT-99 ainda pra deep-link/refresh.
- [ ] **MNT-85** [S] Botão "pular por enquanto" — chama endpoint `POST /onboarding/dismiss` (endpoint 1:1 acoplado ao botão, definido junto: seta `users.dismissed_onboarding_at`). Não conclui onboarding, mas some da UI até próximo login. Badge discreto no header lembra ("Complete seu setup")

---

## Fase 9 — Notifications (UI) — migrada de 011-notifications

- [ ] **MNT-186** [T][S] Cliente Capacitor: hook `usePushRegistration()` — no `AppShell` do `/web`, roda em background: pede permissão via `@capacitor/push-notifications`, pega token do FCM, envia pro backend (`POST /notifications/register-device`, MNT-185). Refresh do token: listener em `pushNotificationsRegistration` re-envia. Tratamento de negação (user pode ativar depois em settings)
- [ ] **MNT-191** [S] UI `/settings/notifications` — toggles pra cada rule + range de quiet hours (TimeRangePicker do shadcn se existir ou custom). Lista de devices registrados (`GET /notifications/devices`) com botão "revogar" — útil se perder o celular

---

## Estados vazios importantes (checklist)

Toda tela precisa ter empty state pensado. Consolidado aqui pra o reviewer conferir:

| Tela | Empty state |
|------|-------------|
| Dashboard sem contas | "Comece cadastrando seus bancos pelo chat" |
| Dashboard com contas, sem transações | "Registre seu primeiro gasto — fala pelo assistente ou toca no +" |
| Chat vazio | Sugestões clicáveis: 3-4 prompts comuns |
| Transações vazio | "Sem transações no período. Ajusta o filtro ou registra uma nova" |
| Bancos vazio | "Cadastra sua primeira conta pra começar" |
| Recurring vazio | "Cadastre seu salário/renda fixa pelo chat" |
| Charts salvos vazio | "Peça um gráfico no chat e salve pra ver aqui" |
| Sessions active (settings) | "Só essa sessão ativa" (sempre tem a atual) |
| Audit log vazio | "Nenhuma atividade registrada ainda" |

---

## Referências

- shadcn/ui — https://ui.shadcn.com
- lucide-react — https://lucide.dev
- @tanstack/react-virtual — https://tanstack.com/virtual
- Next.js Route Groups — https://nextjs.org/docs/app/building-your-application/routing/route-groups
- Ready Player Me — avatar creator iframe: https://docs.readyplayer.me/ready-player-me/integration-guides/web/avatar-creator-integration
- Ready Player Me — morph targets/visemes: https://docs.readyplayer.me/ready-player-me/avatars/avatar-configuration/morph-targets
- @readyplayerme/visage (three.js React): https://github.com/readyplayerme/visage
- Mixamo (animações mocap grátis compatíveis com RPM): https://www.mixamo.com
