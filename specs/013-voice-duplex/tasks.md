# Voz full-duplex — mic capture + streaming pra Realtime (MNT-194..MNT-199)

Slice que fecha o loop bidirecional da conversa: hoje o assistente fala mas o user não pode responder. Aqui a gente adiciona captura de mic no browser, encode PCM16 → base64 → envio via WS pra Realtime GA, e wire no /onboarding (e depois /chat).

Contexto: MNT-84 já implementou o receive-side (assistente fala, front toca). MNT-50 (`5b98cf3`) já ajustou a compat GA. Falta o transmit-side.

---

## Referências cruzadas

| Depende de                                | Spec origem       | Comentário |
|-------------------------------------------|-------------------|------------|
| WS gateway `/agent/ws` (MNT-50)           | 003-assistant     | Bridge cliente↔Realtime já existe |
| `session.update` no `wireSystemPrompt`    | 003-assistant     | Vai ganhar input config em MNT-194 |
| Hook `useAgentSession` + VoiceOrb         | 009-ui-shell      | Vai ganhar mic capture em MNT-195/196 |
| Barge-in TTS via `input_audio_buffer.speech_started` (MNT-57) | 003-assistant | Já wired — só emite o evento |
| Chat page `/chat` (MNT-101)               | 009-ui-shell      | Consumidor futuro do MicButton, deferred |

---

## Decisões técnicas

- **Formato de áudio upstream**: `pcm16` mono 24 kHz — o que a OpenAI Realtime GA aceita. Sem resample no server; browser cria `AudioContext({ sampleRate: 24000 })`.
- **Encoder no browser**: `ScriptProcessorNode` no MVP (deprecated mas funciona sem arquivo worklet separado). Migrar pra `AudioWorklet` numa iteração futura se performance/glitches aparecerem em Safari/mobile.
- **VAD**: server-side (`turn_detection: { type: 'server_vad', ... }`) — a OpenAI detecta quando o user começa/termina de falar e responde sozinha. Simplifica o cliente (sem push-to-talk lógica).
- **Barge-in**: já wired no `wireTtsTap` — quando `input_audio_buffer.speech_started` chega upstream, o `TtsPipeline.cancel()` mata a síntese ativa. Nada novo aqui.
- **Permission model**: `getUserMedia` exige gesto do user → botão de mic explícito. Não tenta pegar mic passivamente no mount.
- **VoiceOrb reage à voz do user também**: já suporta prop `audioStream` (MediaStream do mic). Passa da hook pro orb pra o mesmo elemento vibrar com quem tá falando.

---

## Fase 0 — Backend: session config full-duplex

- [ ] **MNT-194** [T][S] `wireSystemPrompt` estende `session.update.session` com:
  - `input_audio_format: 'pcm16'`
  - `turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 }`
  - Se o GA reclamar de shape (tipo `session.audio.input.*`), ajustar conforme erro upstream. Segue o pattern do MNT-50 (aprender pelo erro do Realtime).
  - Testes em `test/agent/infrastructure/gateways/agent-realtime.gateway.spec.ts` asseriam presença dos campos no `session.update`. Não asseriam runtime real (depende do provider).

---

## Fase 1 — Frontend: captura de mic

- [ ] **MNT-195** [T][S] Estende `useAgentSession` OU cria hook filho `useMicCapture`:
  - Nova opt `micEnabled: boolean`. Quando vira `true`:
    1. `navigator.mediaDevices.getUserMedia({ audio: true })`
    2. `new AudioContext({ sampleRate: 24000 })`
    3. `MediaStreamAudioSourceNode` → `ScriptProcessorNode(bufferSize: 4096)` → callback com Float32Array
    4. Converte pra Int16Array (clamp + scale), base64-encode, envia `{ type: 'input_audio_buffer.append', audio: '<base64>' }` via WS.
    5. Expõe `micStream: MediaStream | null` no retorno.
  - Estados novos no enum `AgentSessionStatus`: **manter enum atual** — o `micStatus` fica em campo separado (`micState: 'off' | 'requesting' | 'live' | 'denied' | 'error'`).
  - Cleanup: `mediaStream.getTracks().forEach(t => t.stop())`, `context.close()`, disconnect scriptProcessor.
  - Testes: helper puro `float32ToPcm16Base64(samples)` é testável isolado (edge cases: clamp em ±1.0, samples vazias). Mock de `getUserMedia` no hook opcional — se ficar frágil, testa só o helper.

- [ ] **MNT-196** [T][S] Novo atom `web/src/components/atoms/MicButton.tsx`:
  - Botão circular, ícone `Mic` (lucide-react) com pulse quando ativo, ícone `MicOff` quando desligado, `AlertTriangle` quando denied.
  - Props: `{ state: 'off' | 'live' | 'denied' | 'requesting', onToggle: () => void }`.
  - Reutilizável em `/onboarding` (MNT-197) e `/chat` (MNT-101 futuro).
  - Segue padrão atômico do projeto (PascalCase, arquivo em atoms).

---

## Fase 2 — Wire no `/onboarding`

- [ ] **MNT-197** [T][S] `OnboardingHero` renderiza `<MicButton>` abaixo do BarLoader (mesmo slot).
  - `BarLoader` some quando `isWarming = false` (como já é hoje). `MicButton` aparece no lugar quando `!isWarming && !error`.
  - Estado do micButton derivado do `useAgentSession().micState`.
  - Ao clicar: hook flipa `micEnabled: true`. Se `denied`, mostra toast com instrução de habilitar mic no browser.
  - `VoiceOrb` recebe `audioStream={micStream ?? undefined}` além do `audioElement` — orb pulsa quando o assistente fala OU quando o user fala.
  - Barge-in fica automático via server VAD → gateway cancela TTS → `tts.audio.canceled` chega no hook → `chunksRef` esvazia (já tratado no MNT-84).

---

## Fase 3 — Iteração UX (deferred)

- [ ] **MNT-198** [S][DEFERRED] Wire `MicButton` no `/chat` — depende do MNT-101 existir.
- [ ] **MNT-199** [S] Iterações de polish:
  - Indicador visual de "cortando fala do assistente" (barge-in) no orb (talvez uma cor de outline).
  - Fallback UX quando permission denied (tela explicativa em vez de só toast).
  - Migrar `ScriptProcessorNode` → `AudioWorklet` quando alguém reclamar de glitch.

---

## Fase 4 — Onboarding com tools (MNT-200..MNT-205)

Slice que fecha o loop conversacional: o agente executa tools que persistem no DB e o frontend renderiza cards visuais das intenções (preview) e resultados. Fluxo obrigatório em ordem: **nickname → banks → balances → complete**. Se pular etapa, `complete_onboarding` recusa.

### Decisões técnicas

- **Confirmação por voz** — o agente pergunta "vou adicionar Nubank, PicPay e BTG, tá certo?" e o user responde por voz. Nada de botão de confirm. Toda decisão é do playbook.
- **Fuzzy match** de banco por nome falado — normaliza (lowercase + sem acento) e busca ILIKE contra `Bank.name`. `"nubank"` → `Nubank`, `"btg"` → `BTG Pactual`. Se ambíguo/não-encontrado, tool retorna `notFound: [...]` no result e o playbook manda o agente perguntar.
- **Coleta agrupada** de saldos — o agente pergunta "quanto tem em cada?" e recebe tudo numa call só (`set_account_balances({ balances: [{ bankName, balance }] })`). Menos ping-pong.
- **Envelopes novos no WS gateway↔cliente** pra render preview visual:
  - `{ type: "tool.pending", toolName, args, callId }` — cai no cliente antes da execução, front anima "adicionando…"
  - `{ type: "tool.result", callId, result }` — pós-execução, front vira "adicionado ✓"
  - `{ type: "tool.error", callId, message }` — erro, front mostra estado ruim + agente explica na voz
- **Gateway wire do dispatcher** — hoje o `ToolRegistry` existe mas as tools não são executadas no fluxo. A gente adiciona um `wireToolDispatcher` que:
  1. Escuta `response.function_call_arguments.done` do upstream OpenAI
  2. Emite `tool.pending` pro cliente
  3. Chama `ToolDispatcher.dispatch({ toolName, args, userId })`
  4. Emite `tool.result` (ou `.error`) pro cliente
  5. Devolve pro OpenAI via `conversation.item.create` com `type: "function_call_output"`, e dispara nova `response.create` pra ele continuar falando.

### Referências cruzadas

| Depende de                             | Origem                | Comentário |
|----------------------------------------|-----------------------|------------|
| ToolRegistry + Dispatcher (MNT-52..54) | 003-assistant         | Já existe, precisa wire no gateway |
| Seed de bancos (`prisma/seed.ts`)      | api/prisma            | 21 bancos BR já seedados |
| `UserBankAccount` model                | api/prisma/schema     | Tabela + repo já existem |
| `users.nickname` + `users.onboardedAt` | 002-auth              | Colunas existem |
| MNT-84 hook `useAgentSession`          | 009-ui-shell          | Precisa consumir novos envelopes `tool.*` |

### Tasks

- [ ] **MNT-200** [T][S] Wire do `ToolDispatcher` no gateway + envelopes `tool.pending`/`tool.result`/`tool.error`.
  - Novo util `wireToolDispatcher(ctx)` que injeta o dispatcher e escuta `response.function_call_arguments.done` do upstream.
  - Registra as tool schemas exportadas pelo `ToolRegistry` no `session.update` (campo `tools`) pra OpenAI conhecer.
  - Envelopes novos em `TTS_EVENT_TYPE` (rename pra `WS_EVENT_TYPE` ou split — a decidir).
  - Testes: mock do dispatcher, valida a sequência `pending → dispatch → result` + envio de `conversation.item.create` upstream com `function_call_output`.

- [ ] **MNT-201** [T][S] Tool `set_nickname` em `api/src/agent/tools/onboarding/set-nickname.tool.ts`.
  - JSON schema: `{ nickname: string(1..50) }`.
  - `execute({ nickname }, ctx)`: `UsersService.updateNickname(ctx.userId, nickname)`.
  - Playbook: "chame depois que o user disser como quer ser chamado. Confirma pra ele que o apelido X foi salvo e mencione uma vez que ele pode mudar em qualquer momento no perfil. Não repita a menção de mudança depois."
  - Testes: use-case unit (mock repo) + registry integration (schema well-formed).

- [ ] **MNT-202** [T][S] Tool `add_user_banks` em `api/src/agent/tools/onboarding/add-user-banks.tool.ts`.
  - JSON schema: `{ banks: string[] }` (nomes falados).
  - `execute({ banks }, ctx)`:
    1. Normaliza cada nome (lowercase + remove acento).
    2. Query `Bank` com `WHERE unaccent(lower(name)) LIKE '%normalized%' OR compe_code = normalized`.
    3. Pra cada match único → cria `UserBankAccount` com `bank_id`, `nickname: bankName`, `balance: 0`.
    4. Retorna `{ created: [{ accountId, bankName }], notFound: [nomeFalado] }`.
  - Playbook: "sempre confirme por voz antes de chamar. Depois de executar, se `notFound` não vazio, pergunte 'não achei X, você quis dizer outro banco?'. Se `created` vazio, não avance pra saldos."
  - Testes: fuzzy match unit (edge cases: acento, plural, sigla), use-case com repo real (integration/Postgres).

- [ ] **MNT-203** [T][S] Tool `set_account_balances` em `api/src/agent/tools/onboarding/set-account-balances.tool.ts`.
  - JSON schema: `{ balances: Array<{ bankName: string, balance: number }> }`.
  - `execute({ balances }, ctx)`:
    1. Fetch `UserBankAccount` do user com JOIN em `Bank`.
    2. Pra cada `{bankName, balance}` → match com o account do user (mesma normalização do MNT-202).
    3. Update `balance` do account.
    4. Retorna `{ updated: [{ accountId, bankName, balance }], notMatched: [] }`.
  - Playbook: "chame depois que o user disser todos os saldos de uma vez. Se algum banco não bater, pergunte de novo."
  - Testes: unit + integration.

- [ ] **MNT-204** [T][S] Tool `complete_onboarding` em `api/src/agent/tools/onboarding/complete-onboarding.tool.ts`.
  - JSON schema: `{}` (sem args).
  - `execute({}, ctx)`:
    1. Guard: `user.nickname != null && bankAccountCount > 0 && all balances set (nenhum accountBalance = 0 salvo se explicitamente zerado)`.
       - Se falta algo: retorna `{ ok: false, missing: ['nickname'|'banks'|'balances'] }`.
    2. Set `users.onboarded_at = NOW()`.
    3. Emite `UserOnboardedEvent` interno.
    4. Retorna `{ ok: true }`.
  - Playbook: "chame só depois de ter feito nickname + banks + balances. Se retornar `ok: false`, corrija a etapa que falta antes de tentar de novo."
  - Testes: unit — guard funciona quando falta etapa, sucesso quando tudo OK.

- [ ] **MNT-205** [T][S] UI dos cards preview no `/onboarding` — novo organism `OnboardingProgress` que renderiza abaixo do `OnboardingHero`:
  - **Nickname**: badge "meu apelido: **X**" aparece com fade + slide da direita quando `tool.result` de `set_nickname` chega.
  - **Banks**: 3+ cards em grid (com logo do banco via `bank.logo_url` se tiver, senão placeholder), cada um em estado `pending → success → confirmed`. Slide-up + stagger de 0.1s.
  - **Balances**: mesmo card do banco ganha um counter animado (motion `useSpring` de 0 → valor).
  - **Complete**: transição pro `/` (dashboard) via `router.push` quando `tool.result` de `complete_onboarding` com `ok: true` chega.
  - `useAgentSession` ganha `toolEvents: Array<ToolEvent>` no result, consumido pelo `OnboardingProgress`.
  - Testes: unit dos estados dos cards com mock do hook.

### Fora de escopo dessa fase

- **Editar depois** — mudar nickname/banks/balances vem em `/settings` (outra spec).
- **Categorias custom** — 10 categorias default já vem seedadas; o user aprende pelo assistente depois.
- **Múltiplos accounts por banco** — MVP assume 1 conta por banco. Adicionar mais fica como comando conversacional posterior.
- **Cartões de crédito** — MNT-141+ trata (fase de credit-card billing). Onboarding cobre só contas correntes.

---

## Fora de escopo desse slice

- **STT client-side (Whisper local)**: não. Sempre stream pro Realtime.
- **Push-to-talk manual**: hands-free via VAD é o default. PTT vira feature posterior se necessário.
- **Múltiplos idiomas na captura**: Realtime já detecta automaticamente.
- **Gravação de histórico de áudio**: não persiste voz — só transcript via `response.output_audio_transcript.done` (se quiser guardar log de conversa, é MNT separado).
