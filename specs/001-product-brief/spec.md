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

## Histórico

- 2026-07-14 — Brief inicial capturado por Felipe
- 2026-07-14 — ADR-01/02/03/04 decididos (auth Passport, Postgres, OpenAI Realtime, ElevenLabs)
