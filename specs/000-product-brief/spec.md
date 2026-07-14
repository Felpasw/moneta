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
- **Persistência**: Postgres 16 via docker-compose + TypeORM (migrations manuais, `synchronize: false`)
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
| ADR-02 | Persistência → Postgres 16 (docker-compose) + TypeORM                   | ✅ Decidido |
| ADR-03 | LLM + STT → OpenAI Realtime API (`gpt-4o-realtime`) com output em texto | ✅ Decidido |
| ADR-04 | TTS → ElevenLabs (streaming)                                            | ✅ Decidido |
| ADR-05 | Client ↔ Realtime: ephemeral token OU proxy WebSocket                   | 🛑 Pendente |
| ADR-06 | Memória de conversa: persistir histórico entre sessões?                 | 🛑 Pendente |

---

## Ordem de execução das specs

Sequência de dependência. Blocos posteriores dependem dos anteriores estarem prontos (não necessariamente 100% — leia notas por bloco). Cada bloco pode gerar vários commits/PRs, cada um com sua Release PR do release-please.

### Bloco 0 — Versionamento (`specs/001-release-management`) 🔴

**Antes de qualquer código.** Setup do release-please + commitlint + husky. Sem isso, todo histórico de commit vira "initial 0.1.0" no changelog. Ver `specs/001-release-management/tasks.md`.

Tasks: MNT-149..153.

### Bloco 1 — Foundation & Auth base (`specs/002-auth` parcial)

Infra que segura tudo. Postgres + Redis subindo, TypeORM, módulos, users, JWT, senha, shadcn init.

Tasks: MNT-1..17 (Fase 0 + Fase 1) + MNT-71 (shadcn init dentro da Fase 1.5) + MNT-40..44 (reset de senha).

### Bloco 2 — Framework de tools (`specs/003-assistant` parcial)

Infraestrutura que permite tools existirem — sem OpenAI Realtime ainda. `ToolRegistry`, `ToolDispatcher`, `AssistantContext`, playbooks on-demand, meta-tool `get_tool_help`.

Tasks: MNT-52..54 (Fase 2) + MNT-93..97 (Fase 2.5).

### Bloco 3 — Tools de domínio (`specs/004-transactions` + `specs/005-visualizations`)

O núcleo do produto — dados financeiros. Cada CRUD tem REST endpoint + tool wrapper com playbook. **Neste ponto o assistente ainda não existe**, mas os endpoints funcionam via REST (testes de integração + Postman).

- `specs/004-transactions` (MNT-122..148): banks catalog, contas, categorias, transactions, transfers, faturas de cartão
- `specs/005-visualizations` (MNT-72..79, MNT-88..92): dynamic charts + saved charts

### Bloco 4 — Agent (`specs/003-assistant` restante)

O assistente conversacional em si. Setup dos providers (OpenAI + ElevenLabs), Realtime bridge, TTS streaming, avatar RPM 3D, personalização, memória de conversa. Consome as tools do Bloco 3.

Tasks: MNT-45..51 (Fase 0 + 1) + MNT-55..70 (Fases 3, 4, 5).

### Bloco 5 — Onboarding + UI shell (`specs/006-onboarding` + `specs/007-ui-shell`)

Assistente conduz onboarding conversacional (depende do agent do Bloco 4). UI shell monta as páginas ao redor de todas as capabilities já implementadas.

- `specs/006-onboarding` (MNT-80..87)
- `specs/007-ui-shell` (MNT-98..111)

### Bloco 6 — Auth completo (`specs/002-auth` restante)

Fecha auth com OAuth Google, Passkey (web + Capacitor) e hardening (audit log, pen test, sign-out everywhere). Aditivo — nada quebra se ficar sem por um tempo, mas expande as formas de login.

Tasks: MNT-18..23 (Google) + MNT-24..34 (Passkey web + Capacitor) + MNT-35..39 (Hardening).

### Bloco 7 — `[DEFERRED]` Import (`specs/008-import`)

Só depois de V1 rodando com usuários reais. Ver `specs/008-import/tasks.md` — todas as tasks marcadas `[DEFERRED]`.

Tasks: MNT-112..121.

---

## Histórico

- 2026-07-14 — Brief inicial capturado por Felipe
- 2026-07-14 — ADR-01/02/03/04 decididos (auth Passport, Postgres, OpenAI Realtime, ElevenLabs)
- 2026-07-14 — Ordem de execução definida em 8 blocos (versionamento → foundation → framework → tools → agent → onboarding+ui → auth completo → import)
