# Dashboard + tour pós-onboarding (MNT-207..MNT-212)

Fecha o loop UX do onboarding conversacional. Hoje o `complete_onboarding` é chamado no fim do `/onboarding` — marca `onboardedAt` na hora e redireciona pra `/`. A gente muda pra: `/onboarding` só coleta os dados (nickname/banks/balances/cartão) e chama uma tool nova `finish_setup` (sem side-effect DB) que redireciona pra `/dashboard`; lá o agente **inicia uma sessão nova**, faz um overview curto das features + fala que dá pra editar tudo manualmente, e SÓ AÍ chama `complete_onboarding` marcando o `onboardedAt`.

## Decisões (inline)

- **Rota `/dashboard`** é nova em `web/src/app/(app)/dashboard/`. `/` (raiz) permanece landing pra deslogados.
- **`complete_onboarding` mantém nome + comportamento** (marca `onboardedAt` + emite `users.onboarded`) — muda só QUANDO/ONDE é chamada.
- **Nova tool `finish_setup()`** — sem args, sem side-effect no DB, apenas emite envelope WS que o cliente escuta pra redirecionar. Playbook explica que é distinta de `complete_onboarding`.
- **Nova sessão de agente no `/dashboard`** — monta `useAgentSession` novo, WS novo, system prompt novo. Não reaproveita nada do `/onboarding`.
- **2 modos no dashboard, decididos por `!user.onboardedAt`:**
  - `onboardedAt IS NULL` (chegou do setup): system prompt injeta o `DASHBOARD_TOUR_SNIPPET` → agente inicia falando o overview
  - `onboardedAt` setado: modo livre, agente só escuta comandos do user sem falar antes
- **Overview do tour** cita features core do sistema, sem mencionar rotas específicas de edit (pra não bater em 404):
  - Registrar transações por voz ("gastei 30 no ifood")
  - Consultar saldos das contas e faturas de cartão
  - Categorizar despesas (10 categorias default + custom)
  - Cadastrar novas contas, cartões e cheque especial
  - Fazer transferências entre contas
  - "Se preferir, também dá pra editar tudo pelo menu"
- **Envelope novo `setup.done`** — cai numa nova categoria de eventos WS `SYSTEM_EVENT` (paralela a `TOOL_EVENT` / `TTS_EVENT`) OU vira mais um tipo do próprio `TOOL_EVENT`. A decidir na impl — meu voto: reusar `TOOL_EVENT` com `type: 'system.redirect'` pra não explodir categorias, e adicionar payload `{ target: '/dashboard' }` genérico.

## Fluxo em passos

1. `/onboarding` — o mesmo fluxo de hoje até a etapa 5, MAS o agente termina perguntando "posso finalizar seu setup?" → user OK → chama `finish_setup()`
2. Backend `finish_setup` executa, retorna `ok`, emite envelope `system.redirect` (payload `{ target: '/dashboard' }`)
3. Frontend do `/onboarding` (via `useAgentSession` ou novo hook) escuta o envelope → `router.push('/dashboard')`
4. `/dashboard` monta `DashboardScreen` (template novo) → `useAgentSession({ enabled: true })` conecta WS novo
5. Backend `wireSystemPrompt` no boot: se `!user.onboardedAt`, injeta `DASHBOARD_TOUR_SNIPPET`; senão injeta `DASHBOARD_FREE_SNIPPET` (ou nada — modo passivo)
6. Agente fala o overview conforme o snippet; ao fim pergunta "pronto pra começar?" → user OK → chama `complete_onboarding()`
7. `complete_onboarding` marca `onboardedAt`, emite `users.onboarded`
8. Frontend do dashboard NÃO redireciona depois do tour — user fica na página, sessão continua em modo livre

## Depende de

| Item | Onde | Necessário pra |
|------|------|----------------|
| Wire ToolDispatcher (MNT-200) | 013 | Executar tools no gateway |
| ONBOARDING_SNIPPET expandido (MNT-206) | 013 | Base do snippet do tour |
| `complete_onboarding` (MNT-205) | 013 | Reusar tool (marca onboardedAt) |
| `OnboardingScreen` (MNT-206) | 013 | Consumir envelope de redirect |
| `UsersService.findById` retornando nickname/onboardedAt | 205 | wireSystemPrompt decidir modo |
| Composição de system prompt (`composeSystemPrompt`) | 003 | Adicionar novo modo `dashboardTour` |

## Convenções

Mesmas do CLAUDE.md global + projeto.

---

## Tasks

- [ ] **MNT-207** [T][S] Nova tool `finish_setup()` em `api/src/agent/tools/onboarding/finish-setup.tool.ts`
  - Schema `{}` (sem args), strict
  - Sem side-effect no DB
  - Retorna `{ ok: true }` — mas emite um envelope WS extra `system.redirect` (`{ target: '/dashboard' }`) via wire novo (`wire-system-redirect.ts` ou reusa mecanismo do `sendClientEvent`)
  - Playbook: "Chame no fim do setup do onboarding, depois de nickname + banks + balances (e opcionalmente cartão/overdraft). Emite sinal pro frontend redirecionar pro dashboard onde o tour continua. NÃO confunda com complete_onboarding — esse é chamado só depois do tour no dashboard."
  - Constante `SYSTEM_EVENT.redirect = 'system.redirect'` em `constants/system-event-types.ts`
  - Testes: unit da tool + spec do dispatcher emitindo envelope
  - Wire no `OnboardingToolsModule`

- [ ] **MNT-208** [T][S] `ONBOARDING_SNIPPET` (spec 013) trocado no fim: no lugar de "chame complete_onboarding" agora é "chame finish_setup". Complete_onboarding não é mais responsabilidade do /onboarding.
  - Bump version 3 → 4
  - Ajustar exemplo de confirmação: "Fechou {nickname}, posso finalizar seu setup?" (não "finalizar o setup pra fechar" que dá ideia de já terminar tudo)

- [ ] **MNT-209** [T][S] Nova rota `web/src/app/(app)/dashboard/page.tsx` + template `DashboardScreen`
  - Server component page renderiza `<DashboardScreen />` (client)
  - Template monta `useAgentSession({ enabled: true, micEnabled: false })` — mic começa off, user liga
  - Renderiza `VoiceOrb` + `MicButton` (reusa organism/atom existentes)
  - Sem StepIndicator/OnboardingProgress — dashboard é modo livre + tour por voz
  - Layout inicial: apenas orb centralizado + mic embaixo (parecido com Hero compact do onboarding)
  - Testes: renderiza template + hook chamado com enabled=true

- [ ] **MNT-210** [T][S] Novo snippet `DASHBOARD_TOUR_SNIPPET` em `api/src/agent/domain/prompts/dashboard-tour.ts`
  - Overview curto das features (core listado nas Decisões)
  - Regra de confirmação: pergunta "pronto pra começar?" no fim, aguarda ok, chama `complete_onboarding`
  - Bump version 1
  - `ComposeSystemPromptInput` ganha `dashboardTour?: boolean`
  - `composeSystemPrompt`: se `dashboardTour === true`, injeta o novo snippet (mutuamente exclusivo com `onboarding`)
  - `wireSystemPrompt` decide: `dashboardTour = !user.onboardedAt` quando a conexão vem do path `/agent/ws` E o cliente sinaliza que veio do dashboard OU (mais simples) o backend só sabe pelo estado do user — se `!user.onboardedAt`, e o `/onboarding` já foi feito (ou seja, nickname != null + tem banks), assume que é tour
  - **Simplificação**: usa `hasNickname && hasBanks && !onboardedAt` como discriminador de "dashboard tour" vs "onboarding fresh". Testável isolado
  - Ajusta specs: prompts spec + gateway spec (tour snippet)

- [ ] **MNT-211** [T][S] Frontend consumo do envelope `system.redirect`
  - Extend `useAgentSession`: novo state `redirectTarget: string | null` + reset no unmount
  - Novo dispatcher `makeSystemDispatcher` paralelo ao TTS/Tool no WS
  - `OnboardingScreen` reage a `redirectTarget` via `useEffect` → `router.push(redirectTarget)`
  - Cleanup: quando redireciona, session do /onboarding fecha WS + libera mic; nova sessão no /dashboard monta do zero
  - Testes: mockar envelope na WS, verificar redirect

- [ ] **MNT-212** [T][P][DEFERRED] Polish visual do tour no dashboard
  - Chip/badge "Tour em andamento" enquanto agente fala
  - Skip button "pular tour" (chama complete_onboarding direto)
  - Fica pra depois — MVP funciona só com voz

## Fora de escopo

- **BankSelector visual** — pendente do 008-onboarding, independente do tour
- **Rotas de edit manual** (`/settings`, `/accounts`, `/transactions`, etc) — mencionadas no tour genericamente ("no menu") mas não implementadas nessa fase
- **Analytics do funil** (quantos completam tour vs skipam)
- **i18n** do snippet do tour (fica pra fase de tradução geral)
- **Retomada** — se user desiste no meio do tour e recarrega dashboard, hoje volta a rodar o tour do zero. Retomada inteligente vira ticket separado.

## Referências

- [Spec 003-assistant](../003-assistant/tasks.md) — ToolRegistry, composição de prompt
- [Spec 008-onboarding](../008-onboarding/tasks.md) — fluxo original + pendentes
- [Spec 013-voice-duplex](../013-voice-duplex/tasks.md) — tools do onboarding + UI cards
