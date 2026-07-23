# Onboarding conversacional — backend (MNT-80..83, MNT-86..87)

> UI (MNT-84 modal `/onboarding`, MNT-85 dismiss + endpoint 1:1) migrada pra `specs/009-ui-shell/tasks.md`.

## Decisões (inline)

- **Fluxo**: pós-signup, o assistente conduz uma conversa passo-a-passo pra preencher o estado inicial do user. Voz + chat via a mesma pipeline do `specs/003-assistant/`.
- **Fonte da verdade sobre progresso**: campo `users.onboarded_at TIMESTAMPTZ nullable` (já criado em MNT-5). NULL = ainda não terminou; timestamp = concluído.
- **Progresso parcial**: se o user sair no meio, o próximo login o assistente **retoma** a partir do que falta — o `OnboardingState` é derivado do estado real (`nickname IS NULL`? Tem `user_bank_accounts`? Tem `recurring_rules`?), não de um step counter.
- **Pular**: user pode dizer "depois" a qualquer momento; `onboarded_at` fica NULL, `dismissed_onboarding_at` marca "não incomode agora". Próximo login mostra badge suave, sem tomar a tela.
- **Sem texto livre no prompt**: as perguntas do assistente vêm de snippets fixos (composição igual `treatment/*` em `specs/003-assistant`), tom conforme `treatment_style` do profile.

## Fluxo em passos

1. Assistente carrega. Verifica `users.onboarded_at`. Se NULL, entra em modo onboarding.
2. **Saúda usando `users.name`** (que veio do signup): _"Olá, Felipe! Bem-vindo ao Moneta. Antes de qualquer coisa, como posso te chamar?"_
3. User responde com nickname → tool `set_nickname(nickname)` → salva `users.nickname`
4. Assistente pergunta: _"Beleza, {nickname}. Quais bancos você usa?"_ → tool `add_bank_account({ bankId, nickname, balance, creditLimit? })` (chamada N vezes conforme user lista)
5. Assistente pergunta: _"Você tem algum salário ou renda fixa que entra todo mês?"_ → tool `create_recurring_rule({ type: 'income', kind: 'fixed'|'variable', ... })`
6. Assistente pergunta: _"E despesas fixas — aluguel, streaming, essas coisas?"_ → tool `create_recurring_rule({ type: 'expense', kind: 'fixed', ... })`
7. Assistente fecha: _"Fechou. Sempre que quiser adicionar mais alguma coisa, é só me pedir."_ → tool `complete_onboarding()` → `users.onboarded_at = now()`

## Depende de

| Item | Onde | Necessário pra |
|------|------|----------------|
| Signup com `name` (MNT-9) | `specs/002-auth` | Passo 2 saúda com o nome real |
| `users.nickname` + `onboarded_at` (MNT-5) | `specs/002-auth` | Estado persistente do onboarding |
| ToolRegistry + Dispatcher (MNT-52..54) | `specs/003-assistant` | Registrar as tools de onboarding |
| Composição de system prompt (MNT-62) | `specs/003-assistant` | Injetar snippet de onboarding quando `onboarded_at IS NULL` |
| Tools de banco | `specs/005-banks` (a criar) | Passo 4 |
| Tools de recurring | `specs/006-recurring` (a criar) | Passos 5-6 |

## Convenções

Mesmas do `specs/002-auth/tasks.md`.

---

## Fase 0 — Estado do onboarding

- [ ] **MNT-80** [T][S] Value object `OnboardingState` (`api/src/onboarding/domain/onboarding-state.ts`): derivado do estado real do user — `{ needsNickname: !user.nickname, needsBanks: bankCount === 0, needsIncome: incomeRulesCount === 0, needsExpenses: expenseRulesCount === 0, completed: !!user.onboarded_at }`. Use-case `GetOnboardingState(userId)` calcula e retorna. Endpoint `GET /onboarding/state` (auth obrigatório) — usado pelo front pra decidir se abre o assistente automaticamente

## Fase 1 — Tools do assistente

- [ ] **MNT-81** [T][S] Tool `set_nickname({ nickname: string(1..50) })` — validação Zod estrita (trim, sem HTML, max 50), atualiza `users.nickname`. Registrada via `@AssistantTool()` (MNT-52)
- [ ] **MNT-82** [T][S] Tool `complete_onboarding()` — sem input; seta `users.onboarded_at = now()`. Idempotente (chamar duas vezes não é erro, só não faz nada). Publica evento interno `UserOnboardedEvent` (útil pra métricas depois)

## Fase 2 — Prompt do assistente

- [x] ✅ commit `5b98cf3` **MNT-83** [T][S] Snippet `prompts/onboarding.ts` — foco reduzido pra saudação: (a) `users.name` real injetado via `composeSystemPrompt({ userName })` pra evitar alucinação (o modelo tava chamando de "Rafael" random), (b) explica Moneta em 1 frase, (c) pergunta o apelido. Bancos/renda/despesas ficam pra MNT-81/86 (fase de tools). Wire condicional em `wireSystemPrompt`: `UsersService.findById` (novo — substitui `isOnboarded`) decide `onboarding` + injeta `userName`; quando `!onboardedAt`, dispara também `response.create` upstream pro Realtime iniciar a fala. `OnboardingState` completo (MNT-80) fica pra depois — hoje deriva de `user.onboardedAt`. Bundle inclui MNT-50 GA compat (ver `specs/003-assistant/tasks.md`).

## Fase 3 — UX web

MNT-84 (checagem de `GET /onboarding/state` no primeiro carregamento + modal `/onboarding`) e MNT-85 (botão "pular por enquanto" + endpoint `POST /onboarding/dismiss` + coluna `users.dismissed_onboarding_at` + badge no header) migraram pra `specs/009-ui-shell/tasks.md`. O endpoint dismiss fica junto da task de UI já que é 1:1 acoplado ao botão.

## Fase 4 — Robustez

- [ ] **MNT-86** [T][P] Retomada: se user desiste no meio e volta depois, `OnboardingState` recalcula o que falta. Snippet de onboarding (MNT-83) tem lógica "vejo que você já cadastrou {N} bancos, vamos direto pra renda"
- [ ] **MNT-87** [T][P] Golden tests de conversação: fixtures `{ initialState, userMessage, expectedToolCall }` em `api/test/fixtures/onboarding-flows.json`. Casos:
  - Feliz: user novo, responde tudo em ordem
  - Skip: user diz "depois", assistente encerra elegante
  - Interrompido: user cadastrou nickname + 1 banco, sai, volta — assistente retoma na renda
  - Recusa: user diz "não tenho salário fixo" — assistente pula pra despesas sem forçar

---

## Extensões pendentes (adicionar quando decidirmos)

- Coletar `avatar_url` (RPM) no onboarding? Ou deixar user descobrir em `/settings/assistant`?
- Coletar objetivo financeiro (guardar pra X, quitar dívida, controle geral)? Aumenta contexto do assistente pra dar conselhos melhores
- Coletar `treatment_style` no onboarding (radio inline no chat, "prefere formal ou informal?"), ou default `informal` até user mudar em settings?

## Referências

- [Product Brief](../000-product-brief/spec.md)
- [Auth spec](../002-auth/tasks.md) — signup captura `name`
- [Assistant spec](../003-assistant/tasks.md) — ToolRegistry, prompts, session
