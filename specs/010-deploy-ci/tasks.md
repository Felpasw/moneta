# Deploy e CI/CD (MNT-172 … MNT-182)

## Decisões (inline)

- **`/api`** deploya no **Fly.io** (free tier: 3 VMs shared-cpu-1x + 3GB Postgres em `fly-postgres`, latência boa BR via `gru` region)
- **`/web`** deploya no **Vercel** (integração Next.js nativa, preview deploys por PR gratuitos)
- **Docker multi-stage** pro `/api`: build stage (`node:24-alpine` + deps + build) → runtime stage (só `dist/` + `node_modules/production`)
- **Migrations rodam no boot** do container (`entrypoint.sh`: `pnpm typeorm migration:run && node dist/main`). Nunca `synchronize`, nunca migration manual em prod
- **CI em cada PR**: lint + typecheck + test + build. Bloqueia merge se qualquer falhar
- **Preview deploy**: Vercel automático em cada PR do `/web`. Fly.io não tem preview equivalente free — pula preview do `/api`, só produção
- **Secrets**: Fly secrets (`flyctl secrets set`) + Vercel env vars. Nunca no repo. `.env.example` documenta todas
- **Redis em prod**: **Upstash** free tier (10k comandos/dia, 256MB) ou Fly.io Redis addon

## Depende de

| Item | Spec | Necessário pra |
|------|------|----------------|
| Release-please (Bloco 0) | 001-release-management | CI já precisa entender Conventional Commits |
| Auth Fase 0 (docker-compose) | 002-auth | Base do Dockerfile do `/api` |
| Migrations funcionando | 002-auth Fase 0 | Boot roda migration:run |

## Convenções

Mesmas do resto. Muitas tasks têm dependência humana (contas em provedores).

---

## Fase 0 — Docker do `/api`

- [ ] **MNT-172** [T][S] `api/Dockerfile` multi-stage:
  - Build stage: `node:24-alpine`, `WORKDIR /app`, `COPY package.json pnpm-lock.yaml`, `pnpm install --frozen-lockfile`, `COPY . .`, `pnpm build`
  - Runtime stage: `node:24-alpine`, `WORKDIR /app`, copy `dist/`, `node_modules/`, `package.json`; user non-root (`USER node`); `HEALTHCHECK CMD wget -qO- http://localhost:3333/health || exit 1`; `EXPOSE 3333`; `CMD ["node", "dist/main"]`
  - `.dockerignore` — exclui `node_modules`, `dist`, `test`, `.env*`, `*.md`
- [ ] **MNT-173** [T][S] `api/entrypoint.sh` — script que roda `pnpm typeorm migration:run --dataSource dist/config/data-source.js` e depois `exec node dist/main`. Dockerfile chama esse entrypoint em vez de `node dist/main` direto

---

## Fase 1 — Deploy `/api` no Fly.io

- [ ] **MNT-174** 🛑 [HUMANO][SEC] Criar conta Fly.io + `flyctl auth login`. Criar app: `flyctl launch --name moneta-api --region gru --no-deploy` (São Paulo). Provisionar Postgres: `flyctl postgres create --name moneta-db --region gru`. Anotar `DATABASE_URL` gerada. Provisionar Redis (Upstash via marketplace ou Fly Redis): anotar `REDIS_URL`
- [ ] **MNT-175** [T][S] `api/fly.toml` — config app com `[build]` apontando pro Dockerfile, `[env]` com PORT=3333, `[[services]]` port 3333 + healthchecks HTTP em `/health`, `[processes]` app default. Region `gru` primária
- [ ] **MNT-176** [T][S] GitHub Actions `.github/workflows/deploy-api.yml` — trigger `push` em `main` (após Release PR mergeada). Job: `flyctl deploy --remote-only --app moneta-api`. Secret `FLY_API_TOKEN` no repo

---

## Fase 2 — Deploy `/web` no Vercel

- [ ] **MNT-177** 🛑 [HUMANO] Setup Vercel: conectar repo `Felpasw/moneta`, root directory = `web`, framework Next.js auto-detectado. Configurar env vars: `NEXT_PUBLIC_API_URL=https://moneta-api.fly.dev` (produção), preview usa URL de preview do Fly se implementarmos, senão staging manual. Domain custom opcional
- [ ] **MNT-178** [T][S] `.vercelignore` (se necessário) — garante que Vercel só builda `/web` (root directory config já faz isso, mas confirma no build log). Adicionar `output: 'export'` continua? **Não** — em prod queremos SSR pra páginas dinâmicas de settings; mobile Capacitor gera build separado com `output: 'export'`. Solução: duas configs — `next.config.ts` sem export (prod web), `next.config.mobile.ts` com export (Capacitor). Script `build:mobile` usa a config alternativa via `NEXT_CONFIG_FILE`

---

## Fase 3 — CI checks em PRs

- [ ] **MNT-179** [T][S] `.github/workflows/ci.yml` — trigger `pull_request` em qualquer branch. Jobs em matrix:
  - `api-lint-test`: `cd api && pnpm install --frozen-lockfile && pnpm lint && pnpm test`
  - `api-build`: `cd api && pnpm install && pnpm build`
  - `web-lint-test`: `cd web && pnpm install --frozen-lockfile && pnpm lint && pnpm test` (Vitest quando MNT-71 shadcn init + tests)
  - `web-build`: `cd web && pnpm install && pnpm build`
  - `commitlint`: valida commits do PR (defesa em profundidade além do husky local — MNT-152)
- [ ] **MNT-180** [T][S] Branch protection em `main`: PR obrigatório, CI passar obrigatório (todos os jobs acima), Release PR do release-please pode ser mergeada por qualquer (você)

---

## Fase 4 — Secrets + observabilidade básica

- [ ] **MNT-181** 🛑 [HUMANO][SEC] Popular secrets em Fly:
  ```
  flyctl secrets set --app moneta-api \
    JWT_ACCESS_SECRET=<gerado> \
    JWT_REFRESH_SECRET=<gerado> \
    REDIS_URL=<upstash url> \
    OPENAI_API_KEY=<...> \
    ELEVENLABS_API_KEY=<...> \
    ELEVENLABS_DEFAULT_VOICE_ID=<...> \
    RESEND_API_KEY=<...> \
    MAIL_FROM=<noreply@moneta.app> \
    GOOGLE_CLIENT_ID=<...> \
    GOOGLE_CLIENT_SECRET=<...> \
    WEB_ORIGIN=https://moneta.app
  ```
  `DATABASE_URL` já é injetado automaticamente pelo Fly Postgres attach. Nunca commita nenhum desses
- [ ] **MNT-182** [T][S] Atualizar `.env.example` em `/api` e `/web` com **TODAS** as env vars documentadas (nome + comentário curto do que é + valor de exemplo tipo `<from-provider>`). Serve de checklist pra qualquer setup novo. Testes verificam que a app não sobe se falta variável obrigatória (usa validation schema Joi/Zod — MNT-48 já cobre)

---

## Fora de escopo (V1)

- Preview deploy do `/api` (Fly.io não faz nativo free) — DEFERRED. Testa localmente ou usa staging manual
- Blue-green deploy — DEFERRED, single VM basta
- CDN customizado / edge caching — Vercel já faz o `/web`, Fly.io tem edge routing
- Monitoring dashboard próprio (Grafana/Datadog) — Sentry vai cobrir (spec 012)
- Auto-scaling — free tier não tem, single VM aguenta uso solo

## Referências

- Fly.io deploy Node.js: https://fly.io/docs/js/
- Fly Postgres: https://fly.io/docs/postgres/
- Vercel Next.js: https://vercel.com/docs/frameworks/nextjs
- flyctl secrets: https://fly.io/docs/reference/secrets/
- [Release management](../001-release-management/tasks.md)
