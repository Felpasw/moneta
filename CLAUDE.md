# CLAUDE.md — Moneta

Instruções específicas do projeto Moneta. **Estende e sobrescreve** o CLAUDE.md global do usuário onde específico. Global continua valendo pra tudo que não é redefinido aqui.

---

## TDD é OBRIGATÓRIO em todo o projeto

Diferente do padrão global (onde `[T]` é opt-in por task), no **Moneta TDD é o default pra todo código de produção**.

### Regra

**Toda task que cria ou modifica lógica** exige **teste vermelho antes** do código de produção. Sem exceção salvo os casos listados em "Isento" abaixo.

Ciclo canônico por task:

1. Escreva o teste
2. Rode e mostre o **vermelho na conversa**
3. Implemente o mínimo pra passar
4. Rode e mostre o **verde**
5. Refactor se necessário (com testes protegendo)
6. Suite ampla do diretório/módulo tocado continua verde
7. Stage → aguarda `ok` humano

**Tags `[T]` nos `specs/*/tasks.md` continuam válidas por compat**, mas neste projeto **toda task de código é implicitamente `[T]`**, mesmo sem a tag.

### Isento de TDD

Só onde não há lógica testável:

- Migrations puras (SQL declarativo) — teste é o smoke da fase 0 (healthcheck DB)
- Config (docker-compose, `.env.example`, `tsconfig`, `eslint.config`) sem código executável
- Skeleton/scaffold de módulos vazios (o teste vem junto da primeira lógica)
- Assets estáticos (imagens, GLB do RPM, arquivos Rive/Lottie)
- Documentação (`specs/*.md`, `docs/*.md`, `README.md`)
- Copiar snippets de prompt (mas o prompt DEVE ter golden test de conversação junto)

### Stack de teste

- **`/api`** (NestJS): **Jest** já configurado (scaffold). **`@nestjs/testing`** pra module wiring. **supertest** pra integração de endpoints. Testes de repository usam Postgres real via container de teste (não mock — CLAUDE.md global já bane mock de DB quando pode ser evitado)
- **`/web`** (Next.js): **Vitest** + **@testing-library/react** + **@testing-library/user-event** (adicionar como parte da MNT-71 shadcn init OU logo depois)
- **Golden tests de conversação do assistente**: fixtures em JSON, roda mockando LLM em unit + real em e2e opt-in via env var

### Cobertura

Não perseguimos % de cobertura como métrica. Perseguimos **caminho crítico coberto**. Se um bug precisa passar por camada X pra chegar no user, camada X tem teste. Se é wire-up sem lógica (controller que só delega), teste de integração de endpoint cobre — não precisa unit isolado.

---

## Outras convenções do projeto (recap)

Detalhes vivem nos specs. Aqui só ponteiros:

- **Prioridade de execução**: `specs/001-release-management` (MNT-149..153) **antes** de MNT-1. Ver `specs/000-product-brief/spec.md` seção "Ordem de execução"
- **Ticket / branch / tag**: `MNT-N` global crescente, formato `MNT-N/slug` em branch, `[MNT-N]` no fim do commit subject
- **Commit**: Conventional Commits (`<tipo>(<escopo>): <descrição> [MNT-N]`) — release-please analisa isso pra gerar CHANGELOG
- **Persistência**: Postgres 16 (docker-compose) + TypeORM + migrations manuais (`synchronize: false` sempre)
- **Store efêmero**: Redis 7 pra tokens de curta duração (password reset, email verification, passkey challenges) — ver `specs/002-auth`
- **Auth pattern**: Passport + JWT híbrido — ver `specs/002-auth`
- **UI kit**: shadcn/ui (init em MNT-71) — todos os componentes de UI derivam daí
- **Assistente**: OpenAI Realtime + ElevenLabs + Ready Player Me (RPM) — ver `specs/003-assistant`
- **Playbook obrigatório em todo tool** do assistente (`AssistantTool.playbook: string` não-vazio, linter valida) — carregado on-demand via `get_tool_help` (MNT-94)
- **Segurança em prompt**: campos user-controlled que caem em system prompt DEVEM ser enum/preset, nunca free-text (ver memória)

## Fluxo de trabalho

Segue o do CLAUDE.md global (procurar `tasks.md`, confirmar T-... com humano, TDD, stage-don't-commit). Único ajuste: usar `MNT-N` no lugar de `T-NNN-XX`.
