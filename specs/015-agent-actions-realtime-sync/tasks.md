# Agent actions live indicator + screen state push (MNT-228, MNT-229)

**Status:** backlog (rascunho, ainda não priorizado).
**Motivação:** hoje o user fala com o agente por voz e as tools disparam side-effects no back (transactions, invoices, accounts). O front atual só descobre o que mudou quando o user refaz um `refetch` manual ou muda de rota — não há feedback em tempo real. Duas lacunas UX:

1. **Não dá pra ver o que o agente tá fazendo agora** — quando ele chama `add_installment_purchase`, o user fica mudo esperando sem entender que o back tá trabalhando.
2. **Depois que o agente termina, a tela atual não reflete o novo estado** — user tá em `/banks` conversando; agente registra 3 transações; user tem que sair da tela e voltar pra ver mudança.

## Tasks

- [ ] **MNT-228** [T][S] **Socket de state de actions** — canal (adição no `AgentRealtimeGateway` ou novo namespace) que faz push do ciclo de vida de cada tool call do agente: `tool.start` → `tool.progress` (opcional, quando tools compõem etapas) → `tool.success | tool.error`. Payload mínimo: `{ toolName, correlationId, phase, humanLabel }` (ex: `humanLabel = "Registrando 3 gastos no C6..."`). Frontend consome via hook `useAgentActionState` e renderiza indicador flutuante próximo ao avatar do agente com a última label. **Não** substitui logs — é UX puro, mensagens curtas em pt-BR. Sem persistência (in-memory por sessão). Ver `api/src/agent/infrastructure/gateways/agent-realtime.gateway.ts` e `api/src/agent/tools/infrastructure/tool-dispatcher.ts` como pontos de instrumentação.

- [ ] **MNT-229** [T][S] **Socket de update de state (refetch broadcast)** — quando o agente termina um turn que gravou dado, o back emite `state.invalidate` com a lista de recursos que mudaram (ex: `["accounts", "transactions"]` ou mais granular `[{ resource: "invoice", id }]`). Frontend com TanStack Query captura no hook global `useAgentStateSync` e chama `queryClient.invalidateQueries({ queryKey: [resource] })` — telas atualizam sozinhas sem o user precisar recarregar. Regras: (a) só broadcast pra sessão do próprio user (auth do WS); (b) coalesce eventos do mesmo turn (múltiplas tools no mesmo turn = 1 invalidate no fim); (c) fallback pro polling de 30s continua ligado por resiliência de conexão caída.

## Referências ao código existente

- Gateway atual: `api/src/agent/infrastructure/gateways/agent-realtime.gateway.ts` — já mantém sessão WS por user, ponto natural pra ambos os canais
- Tool dispatcher: `api/src/agent/tools/infrastructure/tool-dispatcher.ts` — envolve todas as chamadas de tool, seria o interceptor pra `tool.start/success/error`
- Hooks do front: `web/src/hooks/useAccounts.ts` e `useDashboard.ts` (TanStack Query) — recebem invalidate; padrão de key já existe (`ACCOUNTS_QUERY_KEYS`)

## Decisões pendentes (não bloqueia rascunho)

- Reusar o mesmo WS que já roda ou criar namespace separado (`/agent/state`)?
- `humanLabel` gerado no back (mais controle) ou derivado no front por `toolName` (menos payload, mais i18n)?
- Se `state.invalidate` deve incluir novos valores no payload (otimistic update) ou só sinalizar refetch (mais simples, escolha inicial)?
