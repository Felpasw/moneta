# Onboarding conversacional — backend + UI (MNT-80..87, MNT-201..206)

> **⚠️ Fluxo redesenhado.** A versão original desse spec pressupunha o assistente
> perguntar bancos/renda/despesas por voz e chamar `add_bank_account` unitário +
> `create_recurring_rule`. O redesign (implementado em `specs/013-voice-duplex/tasks.md`
> fase 4) mudou pra: **frontend expõe catálogo dos 21 bancos, user marca visualmente,
> agente recebe bankIds; renda/despesas saem do onboarding (viram etapas conversacionais
> pós-onboarding).** Este arquivo foi atualizado pra refletir o design vigente.

## Decisões (inline)

- **Fluxo**: pós-signup, o assistente conduz uma conversa passo-a-passo pra preencher o estado inicial do user. Voz + chat via a mesma pipeline do `specs/003-assistant/`.
- **Fonte da verdade sobre progresso**: campo `users.onboarded_at TIMESTAMPTZ nullable` (já criado em MNT-5). NULL = ainda não terminou; timestamp = concluído.
- **Progresso parcial**: se o user sair no meio, o próximo login o assistente **retoma** a partir do que falta — deriva do estado real (`nickname IS NULL`? Tem `user_bank_accounts`? Tem `balance` setado?), não de um step counter.
- **Pular**: user pode dizer "depois" a qualquer momento; `onboarded_at` fica NULL, `dismissed_onboarding_at` marca "não incomode agora". Próximo login mostra badge suave, sem tomar a tela.
- **Sem texto livre no prompt**: as perguntas do assistente vêm de snippets fixos (composição igual `treatment/*` em `specs/003-assistant`), tom conforme `treatment_style` do profile.
- **Bancos vêm da UI, não da voz** (decisão MNT-202 revisada): o frontend carrega os 21 bancos do catálogo, o user marca visualmente, agente recebe `bankIds` já confirmados. Elimina fuzzy match / adivinhação por nome falado.
- **Cartão + cheque especial na mesma row** (decisão MNT-204): `UserBankAccount` guarda `creditLimit`/`closeDay`/`dueDay`/`overdraftLimit` opcionais na row da conta. Cobre 95% dos casos brasileiros (fintechs: 1 conta = 1 relação de crédito).
- **Renda/despesas fora do onboarding**: `create_recurring_rule` deixa de ser passo do onboarding. User configura depois via conversa livre com o assistente ou UI dedicada.

## Fluxo em passos (5 etapas)

1. Assistente carrega. Verifica `users.onboarded_at`. Se NULL, entra em modo onboarding.
2. **Saúda usando `users.name`** (do signup): _"Olá, Felipe! Bem-vindo ao Moneta. Como posso te chamar?"_
3. User responde com apelido → tool `set_nickname({ nickname })` → salva `users.nickname` (MNT-201)
4. Frontend abre seletor visual dos 21 bancos. User marca os que usa → envia `bankIds` pro agente → tool `add_user_banks({ bankIds })` cria as `UserBankAccount` em batch com nickname = nome canônico e balance = 0 (MNT-202)
5. Assistente pergunta os saldos: _"Quanto tem em cada?"_. User responde tudo numa fala → tool `set_account_balances({ balances: [{accountId, balance}] })` (MNT-203)
6. **[Opcional]** Assistente pergunta banco por banco se tem cartão de crédito (limite + dia de fechamento + dia de vencimento) e/ou cheque especial. Se tiver, tool `configure_account_details({ accounts: [{accountId, creditLimit?, closeDay?, dueDay?, overdraftLimit?}] })` (MNT-204). Pode pular tudo — não bloqueia.
7. Assistente fecha: _"Fechou, {nickname}. Quando precisar de algo, é só me chamar."_ → tool `complete_onboarding()` (MNT-205) → guard (nickname + banks) + `users.onboarded_at = now()` + emite `users.onboarded` event

Cada tool result dispara envelope `tool.result` via WS gateway (MNT-200) → `OnboardingProgress` no frontend anima o card correspondente (MNT-206).

## Depende de

| Item | Onde | Necessário pra |
|------|------|----------------|
| Signup com `name` (MNT-9) | `specs/002-auth` | Passo 2 saúda com nome real |
| `users.nickname` + `onboarded_at` (MNT-5) | `specs/002-auth` | Estado persistente |
| ToolRegistry + Dispatcher (MNT-52..54) | `specs/003-assistant` | Registrar as tools |
| Composição de system prompt (MNT-62) | `specs/003-assistant` | Injetar snippet quando `onboarded_at IS NULL` |
| Wire ToolDispatcher no gateway (MNT-200) | `specs/013-voice-duplex` | Executar tools no fluxo WS |
| Seed dos 21 bancos brasileiros | `api/prisma/seed.ts` | Passo 4 |

## Convenções

Mesmas do `specs/002-auth/tasks.md`.

---

## Estado atual (implementação)

### Concluído

- [x] ✅ commit `5b98cf3` **MNT-83** [T][S] Snippet `prompts/onboarding.ts` — foco na saudação: (a) `users.name` real via `composeSystemPrompt({ userName })` pra evitar alucinação, (b) explica Moneta em 1 frase, (c) pergunta o apelido. Wire condicional em `wireSystemPrompt`: quando `!onboardedAt`, dispara também `response.create` upstream pro Realtime iniciar a fala. Bundle inclui MNT-50 GA compat.
- [x] ✅ commit `c889e1a` **MNT-200** Wire do `ToolDispatcher` no gateway + envelopes `tool.pending`/`.result`/`.error`. Registro das tools no `session.update.tools`.
- [x] ✅ commit `1757201` **MNT-201** Tool `set_nickname` (substitui MNT-81).
- [x] ✅ commit `315b3a3` + refac `363e7ac` **MNT-202** Tool `add_user_banks({ bankIds })` — batch, bankIds vindos da UI (substitui `add_bank_account` unitário do fluxo antigo).
- [x] ✅ commit `3e53fe4` **MNT-203** Tool `set_account_balances` — batch, sem negativo, sem duplicata.
- [x] ✅ commit `a1f339a` **MNT-204** Tool `configure_account_details` — cartão + overdraft merged na conta (opcional).
- [x] ✅ commit `297f7e1` **MNT-205** Tool `complete_onboarding` — guard (nickname + banks) + evento `users.onboarded` (substitui MNT-82).
- [x] ✅ commits `d43456a` + `c81d8f7` + `15a4f9c` **MNT-206** UI: `StepIndicator` atom + `OnboardingProgress` organism + `OnboardingScreen` template + `BankIcon` (logos via `@edusites/bancos-brasil`).
- [x] ✅ commit `efea0e8` Seed dos 21 bancos populando `logo_url` com keywords da lib (usado pelo `BankIcon` quando o frontend consumir `bank.logoUrl` direto).

### Pendente

- [ ] **MNT-80** [T][S] Value object `OnboardingState` derivado do estado real: `{ needsNickname, needsBanks, needsBalances, completed }`. Use-case `GetOnboardingState(userId)` + endpoint `GET /onboarding/state`. **Ainda não implementado** — hoje o frontend infere via `useAgentSession` (tool events) + `useAuth` (redireciona pra `/onboarding` quando `!onboardedAt`). Pode virar necessário quando o `BankSelector` precisar saber o estado antes de abrir.
- [ ] **MNT-86** [T][P] Retomada real: se user desistir no meio e voltar, snippet do assistente adapta ("vejo que você já cadastrou {N} bancos, vamos direto pros saldos"). Requer expandir `ONBOARDING_SNIPPET` pra listar as 5 etapas + ler estado atual via `GetOnboardingState`. **Ainda não implementado** — hoje o assistente re-cumprimenta do zero.
- [ ] **MNT-87** [T][P] Golden tests de conversação: fixtures `{ initialState, userMessage, expectedToolCall }` em `api/test/fixtures/onboarding-flows.json`. Casos:
  - Feliz: user novo, responde tudo em ordem
  - Skip: user diz "depois", assistente encerra elegante (dismiss)
  - Interrompido: user cadastrou nickname + 1 banco, sai, volta — assistente retoma nos saldos
  - Recusa opcional: user diz "não tenho cartão de crédito" — assistente pula pra `complete_onboarding` sem `configure_account_details`
- [ ] **BankSelector UI** [T][S] Organism no `/web` que carrega os 21 bancos (via HTTP `GET /banks` ou tool `list_banks`), combobox com filter cliente-side sem acento, user marca vários e confirma. Envia `bankIds` selecionados pro agente via novo envelope WS (`client.banks_selected` ou similar) que o agente vê como contexto pra chamar `add_user_banks`. **Bloqueia o smoke test end-to-end.**
- [ ] **Endpoint HTTP `GET /banks`** (se ainda não existe) pra `BankSelector` consumir sem depender do agente chamar `list_banks`.
- [ ] **Expandir `ONBOARDING_SNIPPET`** com a ordem das 5 etapas + orientação de que bancos vêm do frontend (nunca inventar bankIds).

## Fase de UX web migrada

MNT-84 (checagem de `GET /onboarding/state` no primeiro carregamento + modal `/onboarding`) e MNT-85 (botão "pular por enquanto" + endpoint `POST /onboarding/dismiss` + coluna `users.dismissed_onboarding_at` + badge no header) migraram pra `specs/009-ui-shell/tasks.md`.

---

## Extensões pendentes (adicionar quando decidirmos)

- Coletar `avatar_url` (RPM) no onboarding? Ou deixar user descobrir em `/settings/assistant`?
- Coletar objetivo financeiro (guardar pra X, quitar dívida, controle geral)? Aumenta contexto do assistente pra dar conselhos melhores
- Coletar `treatment_style` no onboarding (radio inline no chat, "prefere formal ou informal?"), ou default `informal` até user mudar em settings?
- Recurring rules (renda/despesas fixas) — saem do onboarding, mas viram conversa livre pós-onboarding OU UI dedicada em `/settings/recurring`

## Referências

- [Product Brief](../000-product-brief/spec.md)
- [Auth spec](../002-auth/tasks.md) — signup captura `name`
- [Assistant spec](../003-assistant/tasks.md) — ToolRegistry, prompts, session
- [Voice duplex spec](../013-voice-duplex/tasks.md) — fase 4 implementou as 5 tools + UI
