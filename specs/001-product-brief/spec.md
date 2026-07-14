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
- **Persistência**: 🛑 HARD STOP — decidir antes de qualquer entidade
- **LLM/voz**: 🛑 HARD STOP — decidir provider(es) antes de implementar tools
- **Auth pattern**: 🛑 HARD STOP — decidir antes de qualquer código de auth (ADR)
- **Segurança financeira**: PAN/CVV/tokens NUNCA persistidos; segredos fora do código; logs sem PII sensível

---

## Decisões pendentes (bloqueios)

| ID     | Decisão                                    | Bloqueia                          |
|--------|--------------------------------------------|-----------------------------------|
| ADR-01 | Auth pattern (custom / Auth.js / managed)  | Toda feature de auth              |
| ADR-02 | Persistência (Postgres/SQLite/etc + ORM)   | Entidades, migrations             |
| ADR-03 | LLM provider (OpenAI/Anthropic/local)      | Tool calling, avaliação de custos |
| ADR-04 | TTS provider (ElevenLabs/OpenAI/nativo)    | Vozes do assistente               |

---

## Histórico

- 2026-07-14 — Brief inicial capturado por Felipe
