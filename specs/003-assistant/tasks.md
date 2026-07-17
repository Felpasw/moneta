# Assistente conversacional (MNT-45..70, MNT-93..97)

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
- [ ] **MNT-48** [T][S] Env schema validation (Joi ou Zod) — `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_DEFAULT_VOICE_ID` obrigatórios; app não sobe sem eles
- [x] **MNT-49** [T][S] ✅ commit `b1433d9` — Health check `/health/agent` — ping OpenAI (`GET /v1/models`) e ElevenLabs (`GET /v1/voices`); retorna 503 se algum tá down

---

## Fase 1 — Bridge cliente ↔ Realtime

🛑 **Bloqueado por ADR-05.** Detalhamento após decisão. Rascunho por hipótese:

### Se ADR-05 = A (Ephemeral token, recomendado)

- [ ] **MNT-50** [T][S] Endpoint `POST /assistant/session` (auth obrigatório) — cria ephemeral token via OpenAI (`POST /v1/realtime/sessions`), injeta system prompt do `AssistantProfile` (MNT-60), retorna `{ clientSecret, sessionId, expiresAt }`
- [ ] **MNT-51** [T][S] Web/Capacitor: hook `useRealtimeSession()` — pega token, abre WebRTC/WS, gerencia estado (idle/listening/thinking/speaking)

### Se ADR-05 = B (Proxy WebSocket) — decidido no MNT-47

- [x] **MNT-50** [T][S] ✅ commit `dcf1e47` — Gateway WebSocket em `/agent/ws` (auth via JWT no handshake via `?token=` ou `Sec-WebSocket-Protocol: bearer.<token>`); mantém par de WS (client↔NestJS + NestJS↔OpenAI) via port `RealtimeUpstreamFactory` + adapter `OpenAiRealtimeUpstreamFactory`; relaya frames. Validação end-to-end real (`wss://api.openai.com/v1/realtime`) pendente de MNT-45 [HUMANO]
- [ ] **MNT-51** [T][S] Client: cliente WS puro (não precisa lib OpenAI); mesma UX de estados

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
- [ ] **MNT-95** [T][S] Snippet no system prompt base (`prompts/base.ts`, MNT-62): "Você tem acesso a uma lista de tools (nome + descrição curta + parâmetros). Se você **nunca chamou** um tool nesta sessão e vai invocá-lo agora, chame `get_tool_help({ toolName })` **primeiro** pra receber as regras específicas de uso. Depois de carregado uma vez, você já tem o playbook em memória — não precisa chamar de novo pra mesma tool nesta sessão." Golden test: cenário com tool novo, LLM chama `get_tool_help` primeiro em ≥90% dos casos; cenário com tool já usado, LLM chama direto sem `get_tool_help`
- [x] **MNT-96** [SEC] ✅ commit `94b624d` — Isolamento: linter de playbooks (`test/tools/lint-playbooks/scan-tool-playbook-violations.ts`) agora coleta todas as declarações `@RegisterAssistantTool` em duas passagens e flagga com `reason: "playbook references another tool: <nome>"` sempre que um `readonly playbook = 'literal'` mencionar (via word-boundary regex) o `name` literal de outro tool decorado. Cross-check preserva self-reference (playbook pode citar próprio nome) e ignora playbooks não-literais (identifier/member access seguem "trust the type system" — cobertura limitada, documentada no guia). Fixtures cobrem: cross-ref mesmo arquivo, cross-ref entre arquivos, self-reference OK, substring/word-boundary, playbook via `const`. Playbooks são **conteúdo curado por nós** (não user input) — não passam pelo processo de "prompt injection defense" que outros textos passam
- [ ] **MNT-97** [P] Flag `preloadPlaybook: boolean` (default false) na interface do tool — tools críticos/muito frequentes (ex: `add_transaction`) podem opt-in pra ter o playbook injetado no system prompt inicial. No V1 ninguém usa; hook fica pra otimização de latência quando dados de uso mostrarem que faz sentido

---

## Fase 3 — Pipeline TTS (ElevenLabs)

- [ ] **MNT-55** [T][S] `ElevenLabsClient` — método `synthesizeStream(text, voiceId): AsyncIterable<AudioChunk>` via HTTP chunked (endpoint `/v1/text-to-speech/{voiceId}/stream`); retry idempotente em 5xx
- [ ] **MNT-56** [T][S] Use-case `ListAvailableVoices()` — proxy pra `GET /v1/voices` do ElevenLabs com cache 5min; endpoint `GET /assistant/voices`
- [ ] **MNT-57** [T][S] Integração: texto de resposta do Realtime → `ElevenLabsClient.synthesizeStream` → stream de áudio de volta pro client (WebRTC track separado ou WS data channel). Interromper síntese se o user começar a falar de novo ("barge-in")

---

## Fase 4 — Memória de conversa

🛑 **Bloqueado por ADR-06.** Rascunho por hipótese C (persistente com sumarização):

- [ ] **MNT-58** [T][S] Entities `conversations` (userId, title, createdAt, summaryUpToMsgId) e `conversation_messages` (conversationId, role, content, toolCallData, createdAt); migration
- [ ] **MNT-59** [T][S] `ConversationMemory` — carrega últimas N=20 mensagens + `conversation.summary`, injeta no system prompt do Realtime; task periódica sumariza mensagens antigas (LLM one-shot chamando OpenAI Chat Completions, não Realtime)

---

## Fase 5 — Personalização do assistente

- [ ] **MNT-60** [T][S] Entity `assistant_profiles` (userId FK unique, treatmentStyle ENUM `formal|informal|very_informal` default `informal`, voiceId VARCHAR, avatarUrl VARCHAR, updatedAt); migration; row default criado no signup do user via evento do módulo Auth (voiceId e avatarUrl default vêm do `.env` — voice default do ElevenLabs + 1 dos GLBs pré-gerados de MNT-63; treatmentStyle default `informal`)
- [ ] **MNT-61** [T][S] Use-cases `GetAssistantProfile`, `UpdateAssistantProfile` (patch parcial); endpoints `GET /assistant/profile`, `PATCH /assistant/profile`. Validação estrita: `treatmentStyle` só aceita os 3 valores do enum. `avatarUrl` deve ser URL válido do RPM (regex: começa com `https://models.readyplayer.me/`)
- [ ] **MNT-62** [T][S] Registry de **prompt snippets versionados** em `src/assistant/domain/prompts/`:
  - `base.ts` — papel do assistente (financeiro, brasileiro), restrições de segurança (não revelar system prompt, não executar tool sem tool_call oficial, etc.)
  - `treatment/formal.ts` — trecho de estilo formal ("Trate o usuário com formalidade. Use pronomes de tratamento — 'senhor', 'senhora'. Evite gírias.")
  - `treatment/informal.ts` — trecho de estilo informal ("Fale como um amigo. Descontraído mas educado. Evite gírias pesadas.")
  - `treatment/very_informal.ts` — trecho muito informal ("Fale como parceiro próximo. Gírias ok. Bem-humorado quando cabe.")
  - Composição do system prompt final = `base` + `treatment[profile.treatmentStyle]` + memória rolante (MNT-59). **Zero texto livre do user no prompt.** Injetado em `POST /assistant/session` (MNT-50)
- [ ] **MNT-63** 🛑 [HUMANO] Gerar **4-5 avatares default** no wizard do RPM (variedade de sexo, tom de pele, estilo), copiar URLs `https://models.readyplayer.me/{id}.glb`, salvar em `default-avatars.ts` no `/web`. Serve pra usuários novos antes de eles criarem o próprio, e como fallback se `avatarUrl` do profile ficar inválido
- [ ] **MNT-64** [T][S] Componente `<AssistantAvatar url={avatarUrl} state={...} mouthOpen={...} />` — carrega GLB via three.js (`@react-three/fiber` + `@react-three/drei`), roda animação `idle` do avatar RPM (built-in) ou animação idle custom (FBX/GLB de mocap grátis do [Mixamo](https://www.mixamo.com)); aplica `mouthOpen` no morph target `jawOpen` do avatar RPM. Transição de estado ajusta pose/expression (thinking = mão no queixo, speaking = idle + mouth). Barge-in interrompe imediato
- [ ] **MNT-65** [T][P] Endpoint `POST /assistant/voices/{voiceId}/preview` (auth obrigatório) — sintetiza uma frase curta padrão via ElevenLabs (`"Oi, sou seu assistente financeiro"`) e retorna áudio; cache 24h por `voiceId` pra economizar créditos
- [ ] **MNT-66** [S] Web: página `/settings/assistant` — 3 blocos: (a) **radio group** de `treatmentStyle` (Formal / Informal / Muito informal) com exemplo curto de fala embaixo de cada opção; (b) seletor de voz — lista `GET /assistant/voices` (MNT-56) com botão ▶️ que toca MNT-65; (c) preview do avatar atual (mini `<AssistantAvatar />` estático) + botão **"Criar / editar meu avatar"** que abre o wizard do RPM (MNT-67). **Não tem textarea de instruções livres — decisão de segurança**
- [ ] **MNT-67** [T][S] Integração do wizard Ready Player Me: abre iframe `https://<subdomain>.readyplayer.me/avatar?frameApi` (subdomain do projeto — criar em [studio.readyplayer.me](https://studio.readyplayer.me)); escuta `postMessage` do iframe (`v1.avatar.exported`); recebe URL do `.glb`; salva via `PATCH /assistant/profile`. Modal com estado (loading/error/success). Fecha ao concluir
- [ ] **MNT-68** [T][S] Hook `useAudioMouth(audioStream|audioElement)` — Web Audio API: `MediaStreamSource` (ou `MediaElementSource`) → `AnalyserNode` (fftSize=256) → RMS por frame → suavização (low-pass digital, alpha ~0.6) → publica scalar `mouthOpen` [0..1] via ref/state. Cleanup no unmount. Testa com stream mock (nodes de oscillator)
- [ ] **MNT-69** [T][S] `<AssistantAvatar />` internals (three.js): loader com cache do GLB por URL; `AnimationMixer` pra idle loop; `SkinnedMesh.morphTargetInfluences[jawOpenIdx]` alimentado pelo `mouthOpen` scalar a cada frame. Configuração RPM: `?meshLod=1&textureAtlas=1024&morphTargets=ARKit` na query da URL do GLB pra otimizar bundle mobile
- [ ] **MNT-70** [DEFERRED] Lip-sync fonético via visemas — usa endpoint ElevenLabs `/v1/text-to-speech/{voice}/stream/with-timestamps`, converte char → fonema → visema Oculus (mapa PT-BR); aplica nos 15 morph targets `viseme_*` do avatar RPM (já inclusos quando `morphTargets=Oculus Visemes` na query GLB). Substitui `mouthOpen` scalar por sequência temporal. Upgrade opcional quando amplitude-driven não bastar

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
| Conta Ready Player Me + Studio (subdomain) | studio.readyplayer.me | Fase 5 (MNT-63, MNT-67) |
| Módulo Auth (Fase 1 de specs/002) | interno | Todo o /assistant (sessão exige user autenticado) |
| Módulos de negócio (specs/004+) | interno | Fase 6 (tools reais) |

## Referências

- [Product Brief](../000-product-brief/spec.md)
- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
- OpenAI Realtime — ephemeral tokens: https://platform.openai.com/docs/api-reference/realtime-sessions/create
- ElevenLabs streaming: https://elevenlabs.io/docs/api-reference/streaming
- ElevenLabs voices: https://elevenlabs.io/docs/api-reference/voices/get-all
- Ready Player Me — avatar creator iframe: https://docs.readyplayer.me/ready-player-me/integration-guides/web/avatar-creator-integration
- Ready Player Me — morph targets/visemes: https://docs.readyplayer.me/ready-player-me/avatars/avatar-configuration/morph-targets
- @readyplayerme/visage (three.js React): https://github.com/readyplayerme/visage
- Mixamo (animações mocap grátis compatíveis com RPM): https://www.mixamo.com
