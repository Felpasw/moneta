# UI shell e arquitetura de telas

Casa canônica de **toda UI/frontend** do projeto. Includes:
- MNT-98..MNT-111, MNT-193 (nativos)
- MNT-51, MNT-63..MNT-64, MNT-66..MNT-70 (migradas de 003-assistant)
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
| CRUD `/agent/profile` (MNT-61) | 003-assistant | MNT-66 (`/settings/assistant`), MNT-67 (wizard RPM) |
| `GET /agent/voices` (MNT-56) + `POST /agent/voices/:id/preview` (MNT-65) | 003-assistant | MNT-66 (seletor de voz) |
| Tools `create_visualization`/`run_saved_chart` (MNT-75, MNT-89) | 006-visualizations | MNT-76, MNT-77, MNT-91 |
| Tools de transação/banco/fatura (Fase 5 do 004) | 004-transactions | MNT-141..145 |
| Tools de onboarding (MNT-81) + `GET /onboarding/state` (MNT-80) | 008-onboarding | MNT-84 (modal), MNT-85 (dismiss) |
| Backend push (MNT-184, MNT-185, MNT-190) | 011-notifications | MNT-186 (hook), MNT-191 (`/settings/notifications`) |
| Conta Ready Player Me + subdomain Studio | studio.readyplayer.me (externo) | MNT-63 (avatares default), MNT-67 (wizard) |

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
- [ ] **MNT-105** [S] Insights `/charts` (aba **Insights**) — **já implementado em MNT-91** (`specs/006-visualizations`). Aqui só entra o link da tab
- [ ] **MNT-106** [T][S] Settings hub `/settings` (aba **Perfil**) — layout com nav lateral (desktop) ou lista clicável (mobile):
  - `/settings/profile` — nickname, name, email, botão "verificar email" (se `email_verified=false`)
  - `/settings/assistant` — implementado em MNT-66 (Fase 3), só entra na nav
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

## Fase 3 — Assistente (chat, avatar RPM, settings) — migrada de 003-assistant

Tasks originalmente no `specs/003-assistant/tasks.md` que são UI/frontend puro. Vivem aqui por serem componentes/páginas do `/web`. Referências cruzadas pro backend continuam apontando pro spec 003.

- [ ] **MNT-51** [T][S] Client WS puro (não precisa lib OpenAI) consumindo `/agent/ws` do MNT-50. Hook `useRealtimeSession()` (ou equivalente Capacitor) — abre WS com JWT no handshake (query `?token=` ou subprotocol `bearer.<token>`), gerencia máquina de estado (`idle` / `listening` / `thinking` / `speaking`), reconecta com backoff, expõe API pra enviar áudio do mic e receber texto/áudio TTS envelopado (`tts.audio.delta` / `tts.audio.done` / `tts.audio.canceled` / `tts.audio.error`). Reencaminha `speech_started` do VAD do usuário pro backend disparar barge-in (MNT-57). Base pra MNT-101 (página `/chat`)
- [ ] **MNT-63** 🛑 [HUMANO] Gerar **4-5 avatares default** no wizard do RPM (variedade de sexo, tom de pele, estilo), copiar URLs `https://models.readyplayer.me/{id}.glb`, salvar em `default-avatars.ts` no `/web`. Serve pra usuários novos antes de eles criarem o próprio, e como fallback se `avatarUrl` do profile ficar inválido
- [ ] **MNT-64** [T][S] Componente `<AssistantAvatar url={avatarUrl} state={...} mouthOpen={...} />` — carrega GLB via three.js (`@react-three/fiber` + `@react-three/drei`), roda animação `idle` do avatar RPM (built-in) ou animação idle custom (FBX/GLB de mocap grátis do [Mixamo](https://www.mixamo.com)); aplica `mouthOpen` no morph target `jawOpen` do avatar RPM. Transição de estado ajusta pose/expression (thinking = mão no queixo, speaking = idle + mouth). Barge-in interrompe imediato
- [ ] **MNT-66** [S] Página `/settings/assistant` — 3 blocos: (a) **radio group** de `treatmentStyle` (Formal / Informal / Muito informal) com exemplo curto de fala embaixo de cada opção; (b) seletor de voz — lista `GET /agent/voices` (MNT-56) com botão ▶️ que toca MNT-65; (c) preview do avatar atual (mini `<AssistantAvatar />` estático) + botão **"Criar / editar meu avatar"** que abre o wizard do RPM (MNT-67). **Não tem textarea de instruções livres — decisão de segurança**. Persiste via `PATCH /agent/profile` (MNT-61)
- [ ] **MNT-67** [T][S] Integração do wizard Ready Player Me: abre iframe `https://<subdomain>.readyplayer.me/avatar?frameApi` (subdomain do projeto — criar em [studio.readyplayer.me](https://studio.readyplayer.me)); escuta `postMessage` do iframe (`v1.avatar.exported`); recebe URL do `.glb`; salva via `PATCH /agent/profile`. Modal com estado (loading/error/success). Fecha ao concluir
- [ ] **MNT-68** [T][S] Hook `useAudioMouth(audioStream|audioElement)` — Web Audio API: `MediaStreamSource` (ou `MediaElementSource`) → `AnalyserNode` (fftSize=256) → RMS por frame → suavização (low-pass digital, alpha ~0.6) → publica scalar `mouthOpen` [0..1] via ref/state. Cleanup no unmount. Testa com stream mock (nodes de oscillator)
- [ ] **MNT-69** [T][S] `<AssistantAvatar />` internals (three.js): loader com cache do GLB por URL; `AnimationMixer` pra idle loop; `SkinnedMesh.morphTargetInfluences[jawOpenIdx]` alimentado pelo `mouthOpen` scalar a cada frame. Configuração RPM: `?meshLod=1&textureAtlas=1024&morphTargets=ARKit` na query da URL do GLB pra otimizar bundle mobile
- [ ] **MNT-70** [DEFERRED] Lip-sync fonético via visemas — usa endpoint ElevenLabs `/v1/text-to-speech/{voice}/stream/with-timestamps`, converte char → fonema → visema Oculus (mapa PT-BR); aplica nos 15 morph targets `viseme_*` do avatar RPM (já inclusos quando `morphTargets=Oculus Visemes` na query GLB). Substitui `mouthOpen` scalar por sequência temporal. Upgrade opcional quando amplitude-driven não bastar

---

## Fase 4 — Foundation shadcn/ui — migrada de 002-auth e 006-visualizations

Pré-requisito de toda UI. Precisa acontecer **antes** de qualquer outra task deste spec (exceto documentação).

- [ ] **MNT-71** [S] Init shadcn/ui em `/web`: `pnpm dlx shadcn@latest init` (base color neutral, react-server-components on, path `@/components`); adicionar componentes base já esperados — `button`, `input`, `label`, `form`, `dialog`, `radio-group`, `select`, `card`, `avatar`, `tabs`, `scroll-area`, `sonner`. Ajustar `tailwind.config` e `globals.css` conforme output do CLI. Verificar que build passa
- [ ] **MNT-72** [S] Adicionar componente `chart` do shadcn: `pnpm dlx shadcn@latest add chart`. Instala Recharts como peer dep, cria `/web/src/components/ui/chart.tsx` com `<ChartContainer>`, `<ChartTooltip>`, `<ChartTooltipContent>`, `<ChartLegend>`, `<ChartLegendContent>` + type `ChartConfig`

---

## Fase 5 — Auth (UI) — migrada de 002-auth

- [ ] **MNT-193** [T][S] Páginas `/login` e `/signup` em `/web/src/app/(auth)/` — casca principal da UI. Consomem `POST /auth/login` e `POST /auth/signup` (MNT-13). Segue **integralmente** o padrão descrito em "Decisões" (`services/auth.service.ts` + `services/interfaces/auth.interface.ts` + `hooks/useAuth.ts` com `useLogin`/`useRegister`/`useLogout`/`useGetProfile` via TanStack Query). Form via `react-hook-form` + zod resolver. UI com shadcn (`Card`, `Input`, `Label`, `Button`, `Form`). Toast de erro/sucesso via `sonner`. Link "Esqueci minha senha" já presente (aponta pra `/forgot-password` — página real vem no MNT-44). Redirect pós-sucesso pra `/` (middleware do MNT-99 depois cuida do desvio pra `/onboarding` quando `onboarded_at IS NULL`)
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

- [ ] **MNT-84** [T][S] Primeiro carregamento pós-login checa `GET /onboarding/state` (MNT-80). Se `!completed`, abre modal/página `/onboarding` que já inicia sessão do assistente em modo onboarding (usa gateway WS de MNT-50 com flag/hint)
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
