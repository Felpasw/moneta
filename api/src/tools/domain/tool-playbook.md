# Guia — como escrever o `playbook` de uma AssistantTool

Este documento define a **estrutura recomendada** para o campo `playbook` de qualquer classe que implemente `AssistantTool` no Moneta. O playbook é a fonte de verdade das regras de uso de uma tool — o LLM o carrega on-demand via `get_tool_help` (MNT-94) antes de invocar a tool pela primeira vez em uma sessão.

## Onde vive

Sempre **inline no código do tool**, junto da `execute()`. Nunca em banco, config remota ou arquivo separado carregado em runtime. Justificativas:

1. **Versionamento** = git. Toda mudança tem hash, autor, PR.
2. **Revisão** passa obrigatoriamente por PR — regra de negócio do assistente não muda em produção sem code review.
3. **Golden test** (MNT-95) valida contra o playbook do código.
4. **Lookup em runtime** é `Map` em memória (O(1), zero I/O).

Para playbooks longos, extrair para constante do próprio módulo do tool (`constants/<tool>-playbook.ts`) é aceitável — desde que a constante seja `string` literal exportada, não computada.

## Estrutura recomendada

Escreva o playbook em **português BR**, tom direto. Ordem sugerida das seções:

### 1. Propósito
Uma frase: o que a tool faz e para qual objetivo do usuário serve.

### 2. Quando usar
Bullets curtos com os gatilhos naturais na conversa. Foque nos casos positivos.

### 3. Quando NÃO usar
Bullets curtos. Casos em que uma tool vizinha resolve melhor, ou em que não é apropriado chamar (ex: falta contexto, o usuário só quer conversar).

### 4. Exemplos concretos
2–4 pares de "fala do usuário" → "invocação esperada da tool" com parâmetros preenchidos. Use exemplos representativos, não canônicos.

### 5. Edge cases
Situações não-óbvias: valores nulos, ambiguidade de linguagem, colisão com outras tools, timeout, retry. Como a tool se comporta e o que o assistente deve fazer com o resultado.

### 6. Regras invioláveis
O que a tool **nunca** faz, ou o que o assistente **jamais** deve fazer no contexto dela. Segurança e integridade primeiro (ex: nunca aceitar `userId` do usuário; nunca executar sem confirmação em operações destrutivas).

### 7. Tools relacionadas (opcional)
Se houver tools irmãs (`add_transaction` / `remove_transaction`), cite os nomes para o LLM saber que existem — mas **nunca instrua sobre elas aqui**. O isolamento é parte da defesa em profundidade (ver MNT-96).

## O que NÃO fazer

- **Não instrua sobre outras tools** dentro deste playbook. Isso quebra o isolamento — ver MNT-96. Cada tool responde só por si.
- **Não repita** o schema JSON dos parâmetros (`jsonSchema` já cobre). Concentre-se em intent, contexto e regras.
- **Não use dados sensíveis** como exemplo (PAN, CVV, JWT, endereços reais).
- **Não referencie tickets/PRs** (`// como decidido no MNT-XX`). Isso apodrece com o tempo.
- **Não faça o playbook vazio ou de placeholder**. O linter (rodado em CI via `test/tools/lint-playbooks/`) rejeita playbooks vazios; o `ToolRegistry.assertValidTool()` rejeita em runtime também. Playbook é obrigatório.

## Checklist antes de abrir PR

- [ ] Playbook tem as 6 seções mínimas (Propósito, Quando usar, Quando NÃO usar, Exemplos, Edge cases, Regras invioláveis).
- [ ] Nenhuma menção a outras tools além da lista opcional final.
- [ ] Nenhum dado sensível.
- [ ] `npm test` verde (inclui o lint de playbooks).
- [ ] Se houver golden test de conversação para a tool (MNT-95), atualizado com o novo cenário.
