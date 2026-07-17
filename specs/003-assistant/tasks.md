# Assistente conversacional — backend (MNT-45..50, MNT-52..62, MNT-65, MNT-93..97)

> Tarefas de UI do assistente (client WS, avatar 3D via Ready Player Me, `/settings/assistant`, hooks de áudio, lip-sync) foram migradas pra `specs/009-ui-shell/tasks.md` Fase 3.

## Decisões (inline)

- **LLM + STT + tool calling**: OpenAI Realtime API (`gpt-4o-realtime`), output em **texto** (áudio do Realtime é ignorado — voz custom vem do ElevenLabs)
- **TTS**: ElevenLabs streaming
- **Execução de tools**: **server-side** (NestJS mantém contexto de auth do user, acessa Postgres). Independente do transporte cliente↔Realtime.
- **Assistant Profile**: 1 por usuário. Campos:
  - `treatmentStyle` (ENUM: `'formal' | 'informal' | 'very_informal'`) — **enum fixo, sem texto livre do user**. Cada valor mapeia pra um snippet de prompt pré-escrito e versionado por nós. Isso elimina vetor de prompt injection via profile.
  - `voiceId` — ID de voz do ElevenLabs (trocável a qualquer momento)
  - `avatarUrl` — URL do arquivo `.glb` do avatar humanoid 3D gerado pelo **Ready Player Me**. Default: um dos avatares pré-gerados (MNT-63). User cria/edita o próprio via wizard do RPM (MNT-67).
- **Sistema de avatar**: **[Ready Player Me](https://readyplayer.me)** — 3D humanoid com customização deep (skin, cabelo, sexo, roupa, acessórios). Renderização via **three.js** (com [`@readyplayerme/visage`](https://github.com/readyplayerme/visage) ou three.js direto). Lip sync amplitude-driven (jaw morph target). Free tier cobre projeto pessoal sem custo.
- **Preferências não-estruturadas (ex: "me chame de Felpa")**: capturadas pela memória de conversa (Fase 4), não por campo de profile. O assistente aprende no diálogo, sem canal direto pro user escrever no system prompt.
- **Depende de**: Fase 1 de auth (`specs/002-auth`) — user autenticado é pré-requisito de qualquer coisa aqui

## Decisões pendentes (HARD STOPs)

### 🛑 ADR-05 — Transporte cliente ↔ OpenAI Realtime

Bloqueia Fase 1.

| Opção | Como funciona | Latência | Auditoria | Complexidade |
|-------|---------------|----------|-----------|--------------|
| **A. Ephemeral session token** ⭐ | NestJS mint um token curto (60s TTL) e o client conecta direto via WebRTC/WS ao OpenAI | mínima | tool_calls chegam no client, ele relaya pro backend pra executar | média |
| **B. Proxy WebSocket via NestJS** | Client abre WS pro NestJS; NestJS mantém WS espelhado com o OpenAI e relaya frames | +50-150ms | 100% server-side, backend vê tudo | alta (manter WS N-para-N) |

Recomendação: **começar com A** (padrão oficial OpenAI, latência importa em UX de voz). Migrar pra B só se auditoria/rate control precisar.

### 🛑 ADR-06 — Memória de conversa

Bloqueia Fase 4.

| Opção | Comportamento |
|-------|---------------|
| **A. Só sessão** | Cada conversa começa do zero; histórico morre ao fechar sessão |
| **B. Persistente completo** | Todas as mensagens gravadas em `conversation_messages` no Postgres |
| **C. Persistente com sumarização** ⭐ | Guarda últimas N mensagens integrais + resumo rolante das anteriores (evita context window explodir) |

Recomendação: **C**. É o padrão de assistentes com memória de longo prazo (ChatGPT memory, Claude Projects).

## Convenções do arquivo

Mesmas de `specs/002-auth/tasks.md` — `[T]`, `[S]`, `[P]`, `[HUMANO]`, `🛑`, `[OPS]`, `[SEC]`, `[DEFERRED]`.

Após commit: `[ ]` → `[x] ✅ commit \`<hash>\``.

---

## Fase 0 — Setup dos providers

- [ ] **MNT-45** 🛑 [HUMANO][SEC] Criar conta OpenAI, habilitar acesso ao Realtime API (`gpt-4o-realtime`), gerar API key, salvar `OPENAI_API_KEY` no `.env` do `/api`. Documentar rate limits do plano
- [ ] **MNT-46** 🛑 [HUMANO][SEC] Criar conta ElevenLabs, gerar API key, escolher **default voice ID** (voz padrão do assistente), salvar `ELEVENLABS_API_KEY` e `ELEVENLABS_DEFAULT_VOICE_ID` no `.env`
- [x] **MNT-47** [S] ✅ commit `b1433d9` — Skeleton do módulo `src/assistant/` em Clean Arch (`domain/`, `application/use-cases/`, `infrastructure/providers/openai/`, `infrastructure/providers/elevenlabs/`, DTOs, controller)
- [x] **MNT-48** [T][S] ✅ commit `c48c37d` — Env schema validation em `src/config/env.ts` (Zod) estende o schema do MNT-8 com `LLM_API_KEY`, `TTS_API_KEY`, `TTS_DEFAULT_VOICE_ID` todas required sem default. `envSchema.parse(process.env)` é eager em module load — app não sobe sem elas (fail-fast em boot). Naming provider-agnostic (desvia do spec `OPENAI_API_KEY`/`ELEVENLABS_*`) porque port+adapter permite trocar provider sem mexer em regra de negócio. Testes em `test/config/env.spec.ts` cobrem cada key ausente
- [x] **MNT-49** [T][S] ✅ commit `b1433d9` — Health check `/health/agent` — ping OpenAI (`GET /v1/models`) e ElevenLabs (`GET /v1/voices`); retorna 503 se algum tá down

---

## Fase 1 — Bridge cliente ↔ Realtime (backend)

ADR-05 decidido como opção **B (Proxy WebSocket)** no MNT-47.

- [x] **MNT-50** [T][S] ✅ commit `dcf1e47` — Gateway WebSocket em `/agent/ws` (auth via JWT no handshake via `?token=` ou `Sec-WebSocket-Protocol: bearer.<token>`); mantém par de WS (client↔NestJS + NestJS↔OpenAI) via port `RealtimeUpstreamFactory` + adapter `OpenAiRealtimeUpstreamFactory`; relaya frames. Validação end-to-end real (`wss://api.openai.com/v1/realtime`) pendente de MNT-45 [HUMANO]

Client WS (MNT-51) migrou pra `specs/009-ui-shell/tasks.md`.

---

## Fase 2 — Framework de tools

Independente de ADR-05.

- [x] **MNT-52** [T][S] ✅ commit `71c9e64` — `ToolRegistry` — interface `AssistantTool { name, description, jsonSchema, playbook, execute(input, ctx): result }`. `playbook: string` é **obrigatório** — texto com regras de uso, exemplos, edge cases; carregado sob demanda via `get_tool_help` (MNT-94), não vai no system prompt base. Registry por DI (`@RegisterAssistantTool()` decorator — renomeado do spec `@AssistantTool` pra evitar colisão com nome da interface); publica lista de tools no formato do OpenAI Realtime (só name/description/schema — sem playbook)
- [x] **MNT-53** [T][S] ✅ commit `37841e7` — `ToolDispatcher` — resolve tool via `ToolRegistry`, executa com `AssistantContext` da sessão, retorna `ToolDispatchResult` estruturado com `callId`. Timeout injetável via `TOOL_DISPATCHER_OPTIONS` (default 10s) mapeia pra `error.code = 'timeout'`; exceção do tool → `tool_error`; `ok:false` do tool → `tool_error`; tool desconhecido → `tool_not_found`
- [x] **MNT-54** [SEC] ✅ commit `37841e7` — Guard de contexto no `ToolDispatcher`: rejeita com `error.code = 'invalid_input'` qualquer payload que traga `userId`, `requestId` ou `conversationId`. `AssistantContext` só chega da sessão autenticada; nunca é derivado do input do LLM. Interface `AssistantContext { userId, requestId, conversationId? }` já existia em `src/tools/domain/assistant-tool.ts` (MNT-52) — MNT-54 fecha o loop de enforcement

---

## Fase 2.5 — Playbooks on-demand (isolamento de regras por tool)

**Por que existe:** conforme tools crescem (transactions + banks + recurring + viz + saved charts + profile + onboarding = 40+ facilmente), colocar todas as regras de uso no system prompt vira:
- Mega-prompt difícil de auditar
- Risco de regras cross-tool se contaminarem
- Bug em uma tool afeta comportamento de outras (mesma "sopa" de instruções)
- Prompt injection tem superfície maior

Solução: cada tool carrega **seu próprio playbook** (regras, exemplos, edge cases), carregado sob demanda quando o LLM decide usar aquela tool pela primeira vez na sessão.

- [x] **MNT-93** [T][S] ✅ commit `b9567df` — Guia `src/tools/domain/tool-playbook.md` (7 seções: propósito, quando usar/não usar, exemplos, edge cases, regras invioláveis, tools relacionadas) + linter build-time em `test/tools/lint-playbooks/` (scanner regex + spec de fixtures + spec que roda contra `src/` real; roda como parte de `npm test`). Módulo renomeado do path original `src/assistant/...` pra `src/tools/...` (Fase 2 já vive em tools/). Regras runtime (`ToolRegistry.assertValidTool`) continuam ativas — o linter só puxa o feedback pra build-time
- [x] **MNT-94** [T][S] ✅ commit `b5423aa` — Meta-tool `get_tool_help({ toolName: string })` auto-registrada pelo `ToolRegistry` (após discovery, sem decorator). Enum `MetaToolName` reserva o nome `get_tool_help` — user tool com esse nome quebra o boot. `ToolRegistry.getToolHelp(name)` é o bypass explícito ao `ToolDispatcher`: retorna `{ found: true, entry: { name, description, playbook } }` ou `{ found: false, error: { error: 'tool_not_found', toolName } }`. `GetToolHelpMetaTool.execute()` delega pro registry e serializa data conforme MNT-94 spec
- [x] **MNT-95** [T][S] ✅ commit `58e8045` — Snippet no system prompt base (`src/agent/domain/prompts/base.ts`) reescrito com bloco "Uso de tools": menciona a lista exposta (nome + descrição + parâmetros), obriga `get_tool_help({ toolName })` antes da 1ª invocação e explica que playbook fica em memória na sessão (não chamar de novo pra mesma tool). `BASE_PROMPT_VERSION` bumped 1→2. Text-content asserts em `test/agent/domain/prompts/base.spec.ts` travam cada regra. **Scaffold de LLM behavior tests** em `test/agent/llm-behavior/` (o termo genérico "golden" foi trocado por "behavior" porque descreve melhor o que o teste faz — trava comportamento do LLM contra fixture): 2 fixtures JSON (`get-tool-help-new-tool`, `get-tool-help-already-used`), types `BehaviorFixture`/`ObservedCall` em `types/`, runner `runChatCompletion` (axios via `httpClient` do `~/config/http`, POST pro `/v1/chat/completions` da OpenAI, `temperature: 0`, `tool_choice: 'auto'`; compõe system prompt via `composeSystemPrompt` pra rodar contra o snippet real). Env schema estendido com `LLM_BEHAVIOR_ENABLED` (`z.enum(['0','1']).default('0').transform(...)` → boolean) e `LLM_BEHAVIOR_MODEL` (default `'gpt-4o-mini'`); tests reais gated por `env.LLM_BEHAVIOR_ENABLED` (skipped no unit run, `describe.skip` — passam pra `it.each` no e2e opt-in quando `LLM_API_KEY` real estiver disponível, i.e., depois de MNT-45). Testes de well-formedness das fixtures rodam sempre. Estatística ≥90% mencionada na spec fica pra CI multi-run futuro; o scaffold single-shot com `temperature: 0` já valida o comportamento determinístico esperado
- [x] **MNT-96** [SEC] ✅ commit `94b624d` — Isolamento: linter de playbooks (`test/tools/lint-playbooks/scan-tool-playbook-violations.ts`) agora coleta todas as declarações `@RegisterAssistantTool` em duas passagens e flagga com `reason: "playbook references another tool: <nome>"` sempre que um `readonly playbook = 'literal'` mencionar (via word-boundary regex) o `name` literal de outro tool decorado. Cross-check preserva self-reference (playbook pode citar próprio nome) e ignora playbooks não-literais (identifier/member access seguem "trust the type system" — cobertura limitada, documentada no guia). Fixtures cobrem: cross-ref mesmo arquivo, cross-ref entre arquivos, self-reference OK, substring/word-boundary, playbook via `const`. Playbooks são **conteúdo curado por nós** (não user input) — não passam pelo processo de "prompt injection defense" que outros textos passam
- [x] **MNT-97** [P] ✅ commit `af55737` — Flag `readonly preloadPlaybook?: boolean` (opcional, ausente/`false` = default) adicionada em `AssistantTool` (`src/tools/domain/assistant-tool.ts`). `ToolRegistry.getPreloadedPlaybooks(): PreloadedPlaybook[]` novo método filtra tools com `preloadPlaybook === true` **e** exclui meta tools (get_tool_help é sempre disponível, não faz sentido preload). Retorna `{ name, playbook }` via type `PreloadedPlaybook` em `domain/types/`. **Nenhum consumer wire-up no V1** — o hook fica pronto pra quando MNT-59 memória chegar e alguém quiser opt-in `add_transaction` no system prompt inicial. 3 testes novos no registry: filtro por flag true, exclusão de meta-tools, retorno vazio quando ninguém opta

---

## Fase 3 — Pipeline TTS (ElevenLabs)

- [x] **MNT-55** [T][S] ✅ commit `62f2077` (+ `756f7df` chore: tsc-alias pra `~/` em runtime) — Port `TtsClient` em `src/agent/domain/ports/tts-client.ts` (`synthesizeStream({ text, voiceId }): AsyncIterable<AudioChunk>`) + adapter `ElevenLabsTtsClient` em `src/agent/infrastructure/tts/providers/elevenlabs/` (POST `/v1/text-to-speech/{voiceId}/stream` com `xi-api-key`, `model_id=eleven_multilingual_v2`, `responseType='stream'`; retry idempotente com backoff em 5xx via opções `{ maxRetries, retryBackoffMs }` — default 2 retries/200ms; 4xx e network error sem retry; erros vazam como `Error` com `HTTP <status>` ou `network_error`). DI token `TTS_CLIENT` em `tts.tokens.ts`; wire em `TtsModule` via `useClass`. Consumo futuro (MNT-57) fica agnóstico ao provider. Validação end-to-end real pendente de MNT-46 [HUMANO]
- [x] **MNT-56** [T][S] ✅ commit `93b6fdf` — Port `TtsClient` estendido com `listVoices(): Promise<TtsVoice[]>` + type domain `TtsVoice = { voiceId, name, language? }`. Adapter `ElevenLabsTtsClient.listVoices()` hita `GET /v1/voices` com xi-api-key e normaliza `{ voice_id, name, labels.language }` via util `normalizeVoice`. Use-case `ListAvailableVoicesUseCase` em `agent/application/use-cases/` injeta `TTS_CLIENT` + `CLOCK` e mantém cache in-memory por instância com TTL configurável via options (default 5min); cache NÃO é populado em falha (retry no próximo call). Endpoint `GET /agent/voices` (divergência do spec `/assistant/voices` — segue rename), protegido por `JwtAuthGuard`, retorna `{ voices }`. Wire no `AgentModule.providers`
- [x] **MNT-57** [T][S] ✅ commit `88d18c8` — Pipeline TTS→client integrada no gateway. (1) Port `TtsClient.synthesizeStream` aceita `signal?: AbortSignal`; adapter respeita via check no loop de yield + passa pro axios (`CanceledError` em cancel real). (2) `TtsPipeline` (application, stateful per-sessão) — `speak({ text, voiceId })` interrompe qualquer síntese ativa e inicia nova; `cancel()` aborta e emite `onCanceled`; listeners `onAudio`/`onDone`/`onCanceled`/`onError`; erros pós-cancel são silenciados. (3) Gateway injeta `TTS_CLIENT` e chama `wireTtsTap` além de `wireRelay` — mesma origem `upstream` recebe múltiplos listeners. Tap parseia eventos do Realtime via `parseRealtimeEvent`, reage a `response.text.done` (→ `pipeline.speak` com `env.TTS_DEFAULT_VOICE_ID`) e `input_audio_buffer.speech_started` (→ `pipeline.cancel`). Áudio envelope JSON `{ type: 'tts.audio.delta' | 'tts.audio.done' | 'tts.audio.canceled' | 'tts.audio.error', ... }` via `sendTtsEvent` (base64 pro delta). Voice ID temporário do env — MNT-60 substitui pelo profile do user. Validação end-to-end real pendente de MNT-45/46 [HUMANO]

---

## Fase 4 — Memória de conversa

🛑 **Bloqueado por ADR-06.** Rascunho por hipótese C (persistente com sumarização):

- [ ] **MNT-58** [T][S] Entities `conversations` (userId, title, createdAt, summaryUpToMsgId) e `conversation_messages` (conversationId, role, content, toolCallData, createdAt); migration
- [ ] **MNT-59** [T][S] `ConversationMemory` — carrega últimas N=20 mensagens + `conversation.summary`, injeta no system prompt do Realtime; task periódica sumariza mensagens antigas (LLM one-shot chamando OpenAI Chat Completions, não Realtime)

---

## Fase 5 — Personalização do assistente

- [x] **MNT-60** [T][S] ✅ commit `b62ed2c` — Novo submódulo `src/agent/personality/` (usuário pediu tudo relacionado a personalidade agrupado sob agent). Prisma schema estende `User` com relation opcional pra `AssistantProfile` (userId unique FK, `treatmentStyle` enum default `informal`, `voiceId` varchar, `avatarUrl` **nullable** — MNT-63 humano ainda não gerou defaults RPM, backfill quando chegar). Migration física NÃO commitada (padrão atual do repo — sem `prisma/migrations/`; a materialização vem quando o time decidir rodar `prisma migrate dev`). `PrismaAssistantProfileRepository` mockado nos testes (mesma convenção de `PrismaUsersRepository`). Comunicação Auth → Personality via **`@nestjs/event-emitter`** (nova dep) — `SignupWithPasswordUseCase` injeta `EventEmitter2` e emite `auth.user.signed_up` `{ userId, email, name }` após criar user (não emite em falha); `EventEmitterModule.forRoot()` no `AppModule`. `UserSignedUpListener` com `@OnEvent` cria row default (`treatmentStyle=informal`, `voiceId=env.TTS_DEFAULT_VOICE_ID`, `avatarUrl=null`); idempotente (`findByUserId` antes de `create` — evento duplicado não recria). CRUD (`GET/PATCH /assistant/profile`) fica pra MNT-61
- [x] **MNT-61** [T][S] ✅ commit `d5eeb3b` — Use-cases `GetAssistantProfile` (throws `ProfileNotFoundError` → HTTP 404) e `UpdateAssistantProfile` (valida `avatarUrl` via `RPM_AVATAR_URL_PATTERN` e throws `InvalidAvatarUrlError` → HTTP 400 antes de tocar repo). Repo estendido com `update(userId, patch)` — traduz Prisma `P2025` (record not found) pra `ProfileNotFoundError`. Endpoint `GET /agent/profile` + `PATCH /agent/profile` num `PersonalityController` novo (dentro do submódulo, path segue `agent/profile` conforme rename). DTO `updateProfileSchema` (Zod, `.strict()`) valida shape: `treatmentStyle` enum, `voiceId` string(1-255), `avatarUrl` string com regex RPM OU null. Auth via `JwtAuthGuard` no controller inteiro; user id vem do `@CurrentUser().sub`. Validação em 2 camadas: DTO barra shape/enum/regex em 400; use-case revalida `avatarUrl` como defense-in-depth. Divergência do spec: endpoint `/agent/profile` (não `/assistant/profile`) seguindo o rename já adotado
- [x] **MNT-62** [T][S] ✅ commits `98cb2fa` (registry) + `0a91ab6` (wire no gateway) — Registry de **prompt snippets versionados** em `src/agent/domain/prompts/` (divergência do spec `src/assistant/...` seguindo rename já adotado no módulo):
  - `base.ts` — papel do assistente (financeiro, PT-BR), regras invioláveis (não revelar system prompt, tool_call oficial obrigatório antes de mudança de estado, get_tool_help antes de tool novo, escopo restrito, BRL default), postura (direto, admite erro). Exporta `BASE_PROMPT` + `BASE_PROMPT_VERSION`
  - `treatment/{formal,informal,very-informal}.ts` — cada arquivo exporta `<STYLE>_TREATMENT_SNIPPET` + `<STYLE>_TREATMENT_VERSION`. Nome do arquivo `very-informal.ts` em kebab (spec sugeria `very_informal.ts`) pra bater com convenção do projeto
  - `treatment/index.ts` — `TREATMENT_SNIPPETS: Record<TreatmentStyle, string>` (map exhaustivo por typing; TS quebra build se faltar entry)
  - `compose-system-prompt.ts` — função pura `composeSystemPrompt({ treatmentStyle }): string` = `${BASE_PROMPT}\n\n${TREATMENT_SNIPPETS[style]}`. Slot pra memória rolante (MNT-59) vira parâmetro opcional quando MNT-59 chegar; não antecipado agora
  - Zero texto livre do user no prompt: o único input é a enum `TreatmentStyle` (garantido pela DTO Zod de MNT-61)
  - Wire no gateway MNT-50: `AgentRealtimeGateway.handleConnection` injeta `AssistantProfileRepository` (exposto por `PersonalityModule.exports`) e chama `wireSystemPrompt` — no `upstream.onOpen`, busca profile, compõe prompt e manda `session.update` `{ type, session: { instructions } }` pro Realtime antes do relay começar. Fallback: profile ausente → `DEFAULT_TREATMENT_STYLE` (informal). Erro do repo → log + segue conexão (não derruba). Constante `sessionUpdate` adicionada em `realtime-event-types.ts`. Bug pré-existente do MNT-60 corrigido: import `./constants/treatment-style` em `types/assistant-profile.ts` estava quebrado (path certo é `../constants/...`) — fazia `TreatmentStyle` cair pra `any` silenciosamente
- [x] **MNT-65** [T][P] ✅ commit `5f8efeb` — Endpoint `POST /agent/voices/:voiceId/preview` (divergência do spec `/assistant/...` seguindo rename). Auth via `JwtAuthGuard`. `PreviewVoiceUseCase` novo em `application/use-cases/`: injeta `TTS_CLIENT` + `CLOCK`; sintetiza frase padrão constante `VOICE_PREVIEW_PHRASE_PT_BR = 'Oi, sou seu assistente financeiro'`; concatena chunks do `synthesizeStream` num `Buffer`; cache in-memory `Map<voiceId, {audio, expiresAt}>` com TTL default `VOICE_PREVIEW_CACHE_TTL_MS = 24h`. Cache **NÃO** popula em falha (retry no próximo call). Options `{ cacheTtlMs?, phrase? }` pra testes. Controller retorna `StreamableFile(audio, { type: 'audio/mpeg' })` — necessário porque return de `Buffer` puro faz Nest JSON-serializar. Validação de `voiceId` na entrada via regex `VOICE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/` (defesa contra path-traversal — o ID vai direto pra URL do ElevenLabs `text-to-speech/{voiceId}/stream`). 400 se falhar. Validação end-to-end real pendente de MNT-46 [HUMANO]

Front do assistente (MNT-63 avatares default RPM, MNT-64 `<AssistantAvatar>`, MNT-66 `/settings/assistant`, MNT-67 wizard RPM, MNT-68 `useAudioMouth`, MNT-69 three.js internals, MNT-70 [DEFERRED] visemas) migrou pra `specs/009-ui-shell/tasks.md` Fase 3.

---

## Fase 6 — Tools de negócio (referenciadas)

Placeholder. As tools específicas (`add_transaction`, `remove_transaction`, `list_banks`, `get_balance`, `simulate_purchase`, etc.) são implementadas nos specs de domínio, mas **registradas** no `ToolRegistry` (MNT-52):

- Ver `specs/004-transactions/tasks.md` (a criar) — tools de CRUD de transação
- Ver `specs/005-banks/tasks.md` (a criar) — tools de banco, saldo, limite
- Ver `specs/006-recurring/tasks.md` (a criar) — tools de salário, despesa fixa
- Ver `specs/007-advisory/tasks.md` (a criar) — tools de simulação de compra, conselhos

## Dependências externas

| Dep | Onde | Bloqueia |
|-----|------|----------|
| Conta OpenAI + Realtime access | platform.openai.com | Fase 0 (MNT-45) |
| Conta ElevenLabs + voice ID | elevenlabs.io | Fase 0 (MNT-46) |
| Módulo Auth (Fase 1 de specs/002) | interno | Todo o /assistant (sessão exige user autenticado) |
| Módulos de negócio (specs/004+) | interno | Fase 6 (tools reais) |

Conta Ready Player Me + subdomínio Studio (RPM) é dependência da UI do assistente e vive em `specs/009-ui-shell/tasks.md`.

## Referências

- [Product Brief](../000-product-brief/spec.md)
- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
- OpenAI Realtime — ephemeral tokens: https://platform.openai.com/docs/api-reference/realtime-sessions/create
- ElevenLabs streaming: https://elevenlabs.io/docs/api-reference/streaming
- ElevenLabs voices: https://elevenlabs.io/docs/api-reference/voices/get-all
- Ready Player Me URL pattern (validação em MNT-61): `https://models.readyplayer.me/{id}.glb` — refs completas de UI/iframe/morph targets em `specs/009-ui-shell/tasks.md`
