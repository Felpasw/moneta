# Onboarding conversacional (MNT-80 … MNT-87)

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

- [ ] **MNT-83** [T][S] Snippet `prompts/onboarding.ts` — instrui o assistente a: (a) usar `users.name` na saudação inicial, (b) pedir nickname primeiro, (c) seguir a ordem bancos → renda → despesas fixas, (d) tom conforme `treatment_style`, (e) NUNCA inventar dados — sempre confirmar antes de chamar tool. Composição de system prompt (MNT-62) injeta esse snippet quando `OnboardingState.completed === false`

## Fase 3 — UX web

- [ ] **MNT-84** [T][S] Web: primeiro carregamento pós-login checa `GET /onboarding/state`. Se `!completed`, abre modal/página `/onboarding` que já inicia sessão do assistente em modo onboarding (usa `POST /assistant/session` de MNT-50 com flag/hint)
- [ ] **MNT-85** [S] Botão "pular por enquanto" — chama endpoint `POST /onboarding/dismiss` (que seta `users.dismissed_onboarding_at`). Não conclui onboarding, mas some da UI até próximo login. Badge discreto no header lembra ("Complete seu setup")

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

- [Product Brief](../001-product-brief/spec.md)
- [Auth spec](../002-auth/tasks.md) — signup captura `name`
- [Assistant spec](../003-assistant/tasks.md) — ToolRegistry, prompts, session
