# Moneta — Product Brief

## Visão

Assistente monetário conversacional (voz + chat). Usuário fala com o assistente, que registra faturas, gastos e transações, informa próximos vencimentos, executa consultas dinâmicas e gera gráficos a partir de linguagem natural. Assistente tem personalidade customizável e dá conselhos financeiros contextualizados.

---

## Escopo — Requisitos

### 1. Autenticação e usuários

- Cadastro/login com **usuário + senha**
- **Passkey (WebAuthn)** — sem senha, via biometria/hardware key
- **OAuth Google**
- **Arquitetura extensível** — adicionar novos providers (Apple, GitHub, Microsoft, etc.) sem refazer o core de auth
- **Sessão persistente** — usuário continua logado entre app opens (web e mobile)
- **Multi-device** — mesmo usuário logado simultaneamente em web + Capacitor

### 2. Personalização do assistente

- **Prompt de tratamento** — usuário define como quer ser tratado (formal/informal, apelido, tom, idioma, personalidade)
- **Voz** — seleção entre várias vozes (TTS)
- **Avatar** — escolha e customização visual do assistente

### 3. Ferramentas (tool calling do LLM)

Todas as ferramentas devem ser invocáveis pelo assistente via function calling:

**Transações**
- Adicionar transação
- Remover transação
- Editar/alterar transação
- Localizar transação (banco de origem, categoria, tags)

**Fontes de renda**
- Salário fixo (recorrente mensal)
- Salário variável (valor específico por mês, quando aplicável)
- Outras entradas pontuais

**Despesas**
- Despesa fixa (recorrente)
- Despesa variável (pontual)

**Bancos e contas**
- Cadastrar bancos do usuário (múltiplos)
- Registrar saldo em cada banco
- Registrar limite de cada banco (crédito/cheque especial)

**Consultas e visualização**
- Query dinâmica em linguagem natural (ex: "quanto gastei com iFood em junho")
- Renderização de gráfico dinâmico com base no pedido (barras, pizza, linha temporal, etc.)

### 4. Consultoria financeira

- **Simulação de compra** — usuário descreve compra grande, assistente avalia se cabe no orçamento atual e projeta impacto nos próximos meses
- **Conselhos contextualizados** — assistente sugere ajustes baseado em padrões de gasto do usuário

---

## Não-escopo (V1)

- Integração bancária via Open Finance (dados entram manualmente pelo assistente)
- Investimentos, portfólio, ações
- Multi-tenant / conta familiar (single-user por conta)
- Notificações push proativas
- Split/divisão de contas entre pessoas

---

## Restrições técnicas

- **Web**: Next.js 16 App Router + Capacitor 8 (mesma base para iOS/Android)
- **API**: NestJS 11
- **Persistência**: Postgres 16 via docker-compose + Prisma (`schema.prisma` como source of truth, `prisma migrate dev`/`deploy`, sem `db push` em prod)
- **Auth pattern**: Custom Passport + JWT híbrido (access Bearer + refresh cookie/secure storage) — ver `specs/002-auth/tasks.md`
- **LLM + STT + tool calling**: OpenAI Realtime API (`gpt-4o-realtime`)
- **TTS**: ElevenLabs
- **Segurança financeira**: PAN/CVV/tokens NUNCA persistidos; segredos fora do código; logs sem PII sensível

### Stack do assistente conversacional (detalhe)

Fluxo esperado (a ser detalhado em `specs/003-assistant/`):

1. Client (web/Capacitor) captura áudio
2. **OpenAI Realtime** faz STT + inferência LLM com tool calling; output em **texto** (não áudio nativo do Realtime — ignorado pra ter voz custom via ElevenLabs)
3. Tool calls são executados server-side pelo NestJS (auth do usuário, acesso ao Postgres); resultado volta pra sessão Realtime
4. Texto final da resposta é enviado pra **ElevenLabs TTS** streaming
5. Áudio streamado de volta pro client e reproduzido

**Decisões de arquitetura pendentes** (novo bloco de HARD STOPs pra `specs/003-assistant/`):

- Como conectar client ↔ OpenAI Realtime: **ephemeral session tokens** (client direto, latência baixa) OU **proxy WebSocket via NestJS** (mais controle, latência maior). Ephemeral é o padrão da OpenAI; proxy é seguro e mais fácil de auditar tool calls.
- Onde executar tool calls: server-side é obrigatório (auth do user). Se ephemeral, client relaya `tool_call` → NestJS → resultado → client → Realtime.
- ElevenLabs: streaming via WebSocket ou HTTP chunked. Streaming pra evitar latência perceptível.
- Cache/memória de conversa: histórico persistido no Postgres (contexto entre sessões) vs. só durante a sessão.

---

## Decisões (registro)

| ID     | Decisão                                                                 | Status    |
|--------|-------------------------------------------------------------------------|-----------|
| ADR-01 | Auth pattern → Custom Passport + JWT híbrido                            | ✅ Decidido |
| ADR-02 | Persistência → Postgres 16 (docker-compose) + Prisma                    | ✅ Decidido |
| ADR-03 | LLM + STT → OpenAI Realtime API (`gpt-4o-realtime`) com output em texto | ✅ Decidido |
| ADR-04 | TTS → ElevenLabs (streaming)                                            | ✅ Decidido |
| ADR-05 | Client ↔ Realtime: ephemeral token OU proxy WebSocket                   | 🛑 Pendente |
| ADR-06 | Memória de conversa: persistir histórico entre sessões?                 | 🛑 Pendente |

---

## Padrões do projeto

**TDD é obrigatório pra todo código.** Teste vermelho antes do código de produção, sem exceção salvo config/migration/scaffold puros. Vale pra `/api` (Jest) e `/web` (Vitest + Testing Library). Ver `CLAUDE.md` na raiz do repo.

**Ticket/branch/tag**: `MNT-N` global crescente. Branch = `MNT-N/slug`. Commit termina com `[MNT-N]`. Conventional Commits obrigatórios (release-please analisa isso).

**UI kit**: shadcn/ui em tudo. Nada de bootstrap/mui/chakra — foi decidido.

**Playbook obrigatório em todo tool do assistente** (contrato de `AssistantTool` em `specs/003-assistant`). Sem playbook, tool não passa no linter.

**Anti prompt-injection**: campos user-controlled que caem no system prompt são sempre enum/preset, nunca free-text.

**Ownership universal**: todo use-case filtra por `user_id` da sessão. `userId` do payload de tool call é ignorado — sempre do `AssistantContext`.

**Balance atomic**: toda operação que altera saldo (transaction, transfer, invoice payment) roda em transação DB única. Ver `specs/004-transactions` MNT-130.

**Ports & Adapters + DI (NestJS)** pros 3 pilares externos: **DB (Prisma)**, **LLM+STT (OpenAI Realtime)**, **TTS (ElevenLabs)**. Cada um atrás de **port** (interface tipada em `domain/`) + **adapter** concreto em `infrastructure/`. Use-cases e services conhecem só os ports. Trocar provedor (TTS ElevenLabs → OpenAI TTS, LLM Realtime → alternativo, ORM Prisma → outro) = registrar outro adapter no módulo NestJS, zero mudança em regra de negócio. Foi esse padrão que permitiu trocar TypeORM→Prisma antes da primeira linha de código escrita.

**Redis pra efêmero**: tokens de curta duração (password reset, email verification, passkey challenges) vivem no Redis, não no Postgres. Ver `specs/002-auth`.

---

## Ordem de execução das specs

Sequência de dependência. Blocos posteriores dependem dos anteriores estarem prontos (não necessariamente 100% — leia notas por bloco). Cada bloco pode gerar vários commits/PRs, cada um com sua Release PR do release-please.

### Bloco 0 — Versionamento (`specs/001-release-management`) 🔴

**Antes de qualquer código.** Setup do release-please + commitlint + husky. Sem isso, todo histórico de commit vira "initial 0.1.0" no changelog. Ver `specs/001-release-management/tasks.md`.

Tasks: MNT-149..153.

### Bloco 1 — Foundation & Auth base (`specs/002-auth` parcial)

Infra que segura tudo. Postgres + Redis subindo, Prisma, módulos, users, JWT, senha, shadcn init.

Tasks: MNT-1..17 (Fase 0 + Fase 1) + MNT-71 (shadcn init dentro da Fase 1.5) + MNT-40..44 (reset de senha).

### Bloco 2 — Framework de tools (`specs/003-assistant` parcial)

Infraestrutura que permite tools existirem — sem OpenAI Realtime ainda. `ToolRegistry`, `ToolDispatcher`, `AssistantContext`, playbooks on-demand, meta-tool `get_tool_help`.

Tasks: MNT-52..54 (Fase 2) + MNT-93..97 (Fase 2.5).

### Bloco 3 — Tools de domínio (`specs/004-transactions` + `specs/005-recurring` + `specs/006-visualizations`)

O núcleo do produto — dados financeiros. Cada CRUD tem REST endpoint + tool wrapper com playbook. **Neste ponto o assistente ainda não existe**, mas os endpoints funcionam via REST (testes de integração + Postman).

- `specs/004-transactions` (MNT-122..148, MNT-154..157): banks catalog, contas, categorias, transactions, transfers, faturas de cartão, parcelamento
- `specs/005-recurring` (MNT-158..164): salário fixo/variável, despesas fixas, materialização mensal
- `specs/006-visualizations` (MNT-72..79, MNT-88..92): dynamic charts + saved charts

### Bloco 4 — Agent + Advisory (`specs/003-assistant` restante + `specs/007-advisory`)

O assistente conversacional em si + as tools de consultoria financeira. Setup dos providers (OpenAI + ElevenLabs), Realtime bridge, TTS streaming, avatar RPM 3D, personalização, memória de conversa. Consome as tools do Bloco 3.

- `specs/003-assistant` (MNT-45..51 + MNT-55..70): providers, Realtime, TTS, RPM, memória, personalização
- `specs/007-advisory` (MNT-165..171): tools analíticas + simulação de compra + insights ativos

### Bloco 5 — Onboarding + UI shell (`specs/008-onboarding` + `specs/009-ui-shell`)

Assistente conduz onboarding conversacional (depende do agent do Bloco 4). UI shell monta as páginas ao redor de todas as capabilities já implementadas.

- `specs/008-onboarding` (MNT-80..87)
- `specs/009-ui-shell` (MNT-98..111)

### Bloco 6 — Auth completo (`specs/002-auth` restante)

Fecha auth com OAuth Google, Passkey (web + Capacitor) e hardening (audit log, pen test, sign-out everywhere). Aditivo — nada quebra se ficar sem por um tempo, mas expande as formas de login.

Tasks: MNT-18..23 (Google) + MNT-24..34 (Passkey web + Capacitor) + MNT-35..39 (Hardening).

### Bloco 7 — Deploy + CI (`specs/010-deploy-ci`)

Sai do laptop e vai pro ar. Docker do `/api` no Fly.io + `/web` na Vercel + GitHub Actions pra CI (test/lint/build em PR) + secrets em prod. Migrations rodam no boot.

Tasks: MNT-172..182.

### Bloco 8 — Notificações push (`specs/011-notifications`)

FCM proativo — fatura fechando (D-3, D-1), gasto anormal, sessão longa esquecida. Preferências por user + quiet hours.

Tasks: MNT-183..191.

### Bloco 9 — `[DEFERRED]` Import (`specs/012-import`)

Só depois de V1 rodando com usuários reais. Ver `specs/012-import/tasks.md` — todas as tasks marcadas `[DEFERRED]`.

Tasks: MNT-112..121.

---

## Histórico

- 2026-07-14 — Brief inicial capturado por Felipe
- 2026-07-14 — ADR-01/02/03/04 decididos (auth Passport, Postgres, OpenAI Realtime, ElevenLabs)
- 2026-07-14 — Ordem de execução definida em 8 blocos (versionamento → foundation → framework → tools → agent → onboarding+ui → auth completo → import)
- 2026-07-14 — ADR-02 revisado: troca de TypeORM por **Prisma** como camada de persistência (antes de qualquer código escrito). Impacta MNT-2/3/5 (schema.prisma + PrismaService), MNT-74 (ChartQueryBuilder usa Prisma Client API), MNT-146 (injection defense via Prisma), MNT-173 (`prisma migrate deploy` no entrypoint)
