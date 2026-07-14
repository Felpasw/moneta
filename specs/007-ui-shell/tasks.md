# UI shell e arquitetura de telas (MNT-98 … MNT-111)

## Decisões (inline)

- **Chat é primary interaction** — o produto é um assistente conversacional. A UI é construída ao redor disso, não como um formulário-com-chatbot-anexo.
- **Estrutura**: 5 destinos principais (Início / Chat / Transações / Insights / Perfil). Bottom tabs no mobile (Capacitor), sidebar no desktop web. Chat visualmente destacado no centro.
- **Roteamento Next.js App Router com route groups**:
  - `(auth)/` — páginas fora do shell (login, signup, forgot/reset password). Sem nav.
  - `(app)/` — páginas dentro do shell. Layout compartilhado com nav + topbar.
  - `middleware.ts` decide o grupo baseado na sessão.
- **shadcn/ui** como base (MNT-71). Componentes: `Tabs`, `Sheet`, `Card`, `Skeleton`, `Sonner`, `Dialog`, `Dropdown`, `Avatar`, `Button`.
- **Empty states não são opcionais** — toda lista/grid tem um estado vazio explícito com CTA (geralmente "peça pelo chat").

## Depende de

| Item | Spec | Necessário pra |
|------|------|----------------|
| shadcn init (MNT-71) | 002-auth Fase 1.5 | Todo o shell (componentes shadcn) |
| Auth funcional (Fase 1 do 002) | 002-auth | Middleware + rotas protegidas |
| `/onboarding` (MNT-84) | 006-onboarding | Redirect pós-signup |
| Auth pages (MNT-44) | 002-auth | Rotas em `(auth)/` |
| `/settings/assistant` (MNT-66) | 003-assistant | Sub-rota de `/settings` |
| `/charts` (MNT-91) | 005-visualizations | Aba Insights |
| Session Realtime (MNT-50) | 003-assistant | Página `/chat` |
| Tools de tx/banco/recurring | 004-006 (a criar) | Listas e detalhes |

## Convenções

Mesmas do `specs/002-auth/tasks.md`.

---

## Fase 0 — App shell e routing

- [ ] **MNT-98** [T][S] Estrutura do Next.js App Router:
  - `/web/src/app/(auth)/` — layout mínimo (só `<html>`, tokens de tema, sem nav). Contém `login`, `signup`, `forgot-password`, `reset-password`
  - `/web/src/app/(app)/` — layout com shell: header (avatar+nickname+dropdown), main, e `<AppNav>` (bottom tabs mobile / sidebar `lg+`)
  - `<AppNav>` implementa 5 destinos usando shadcn `Tabs` orientation-responsive; destaque visual pro item central (Chat)
  - Ícones via `lucide-react` (já vem com shadcn)
- [ ] **MNT-99** [T][S] `middleware.ts` do Next — lê refresh cookie (MNT-14), decide:
  - Se rota `(auth)` e usuário logado → redirect pra `/` (ou `/onboarding` se `onboarded_at IS NULL`)
  - Se rota `(app)` e não logado → redirect pra `/login?next=<path>`
  - Se logado + não onboarded + rota != `/onboarding` → redirect pra `/onboarding`
  - Chama `GET /onboarding/state` (MNT-80) com cache curto (localStorage flag por sessão) pra evitar N requests

---

## Fase 1 — Páginas do shell

- [ ] **MNT-100** [T][S] Dashboard `/` (aba **Início**):
  - Saudação com `nickname || name` do user
  - Saldo consolidado (soma de `user_bank_accounts.balance`), com toggle mostrar/ocultar (ícone 👁️) persistido em localStorage
  - Row de KPI cards: "Gastos do mês", "Próxima despesa fixa", "Salário previsto"
  - Grid dos `saved_charts` pinados (top 3, via `list_saved_charts` filtrando `pinned=true` — usa MNT-89)
  - FAB fixo bottom-right: 🎤 "falar com o assistente" → navega pra `/chat` já iniciando gravação
  - Empty state se sem contas: card grande "vamos começar? me fala pelo chat"
- [ ] **MNT-101** [T][S] Chat `/chat` (aba **Chat**):
  - Header: `<AssistantAvatar>` (MNT-64) + estado (idle/listening/thinking/speaking) + nome do personagem
  - Thread virtualizada de `<MessageBubble>` — cada bubble suporta texto e `<DynamicChart>` inline quando `message.toolResults[i].name === 'create_visualization'` ou `'run_saved_chart'` (MNT-77)
  - Barra inferior: 🎤 push-to-talk (padrão) + toggle 🎧 hands-free contínuo + campo texto (fallback)
  - Botão "novo chat" no header — cria nova `conversation` (memória persiste no Postgres, MNT-58)
  - Session Realtime iniciada via `POST /assistant/session` (MNT-50)
  - Empty state: sugestões de comandos ("registra meu salário", "quanto gastei essa semana?", "gráfico de gastos por categoria")
- [ ] **MNT-102** [T][S] Transações `/transactions` (aba **Grana**):
  - Lista virtualizada (`@tanstack/react-virtual`) — performance com 10k+ rows
  - Filtros no topo: período (date range picker), banco (multi-select), categoria (multi), tag (multi), tipo (expense/income/all)
  - Search por descrição (debounced)
  - FAB "+" abre `<AddTransactionSheet>` OU redirect pra `/chat?prompt=quero adicionar uma transação`
  - Sub-rota `/transactions/:id` — detail + edit (mesmo Sheet, modo edit)
  - Empty state: "sem transações — comece registrando uma pelo chat"
- [ ] **MNT-103** [T][S] Bancos `/banks` (sub-navegação dentro de **Grana**):
  - Grid de cards das `user_bank_accounts` — cada card: `nickname`, logo do banco (`banks.logo_url`), saldo, limite (se aplicável), % de uso do limite (barra)
  - Botão "+ conta" abre `<AddBankAccountSheet>`
  - Sub-rota `/banks/:id` — extrato daquela conta (mesma UX de `/transactions` já filtrado)
- [ ] **MNT-104** [T][S] Recurring `/recurring` (sub-navegação dentro de **Grana**):
  - Duas abas: **Rendas** e **Despesas fixas**
  - Lista das `recurring_rules` — cada card: nome, valor (default_amount ou "variável"), banco, ativo/inativo
  - Botão "aplicar esse mês" em cada card → chama tool `apply_recurring_rule` (materializa transação)
  - Sub-rota `/recurring/:id` — edit
- [ ] **MNT-105** [S] Insights `/charts` (aba **Insights**) — **já implementado em MNT-91** (`specs/005-visualizations`). Aqui só entra o link da tab
- [ ] **MNT-106** [T][S] Settings hub `/settings` (aba **Perfil**) — layout com nav lateral (desktop) ou lista clicável (mobile):
  - `/settings/profile` — nickname, name, email, botão "verificar email" (se `email_verified=false`)
  - `/settings/assistant` — **já implementado em MNT-66** (`specs/003-assistant`), só entra na nav
  - `/settings/security` — troca de senha, lista de sessions ativas (com botão revogar), passkeys cadastradas (nickname + last_used_at), audit log (últimos 20 eventos)
  - `/settings/data` — botões "Exportar meus dados" (LGPD) e "Deletar conta" (com confirmação dupla)
  - `/settings/about` — versão do app, terms, privacy, licenças

---

## Fase 2 — Padrões cross-cutting

- [ ] **MNT-107** [T][S] `<EmptyState icon title description action?>` — componente shadcn-style reutilizável. Fixtures de copy pra cada lugar: transactions, banks, recurring, charts, sessions. Sempre com CTA (geralmente redirect pro chat)
- [ ] **MNT-108** [T][S] Loading states — `<Skeleton>` do shadcn em listas/cards; Suspense boundaries em cada page do App Router; `loading.tsx` por rota
- [ ] **MNT-109** [S] Toast global — `<Toaster />` do sonner (shadcn) no root layout de `(app)`. Feedback padrão: (a) tool call success (verde curto), (b) tool call error (vermelho com detalhe), (c) mutação de settings salva. Handler central conectado ao WebSocket do assistente
- [ ] **MNT-110** [T][S] Error boundary — `error.tsx` por segmento do App Router. Fallback com botão "recarregar" e link "reportar bug" (mailto ou form). Envia stack pro Sentry (quando MNT-XX de observabilidade entrar)
- [ ] **MNT-111** [S] Dark mode — shadcn suporta via CSS variables. Toggle no `/settings/profile` (light/dark/system). Persiste em localStorage + cookie (pra SSR não flashar). Detecta `prefers-color-scheme` como default

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
