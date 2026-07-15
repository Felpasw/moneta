# Autenticação (MNT-1..44, MNT-71)

## Decisões (inline, sem ADR separado a pedido do Felipe)

- **Pattern**: Passport strategies + JWT híbrido
- **Access token**: JWT, 15 min, sempre no header `Authorization: Bearer`
- **Refresh token**: 30 dias, rotativo (novo a cada refresh, session antiga revogada)
  - Web: cookie `HttpOnly + Secure + SameSite=Lax`, `path=/auth/refresh`
  - Mobile (Capacitor): `@capacitor/preferences` + secure storage nativo
- **Hash de senha**: Argon2id (memoryCost=19456, timeCost=2, parallelism=1)
- **DB persistente**: Postgres 16 via docker-compose + Prisma (`prisma/schema.prisma` como source of truth, `prisma migrate dev` local + `prisma migrate deploy` prod; `db push` proibido — não versiona schema)
- **Store efêmero (Redis 7 via docker-compose)**: tokens de curta duração e single-use ficam **fora do Postgres** — usam Redis com TTL nativo:
  - `password_reset:{token_hash}` → `{ userId }`, TTL 15min, `GETDEL` pra atomicidade single-use
  - `email_verification:{token_hash}` → `{ userId }`, TTL 24h
  - `passkey_challenge:enroll:{userId}` → `{ challenge }`, TTL 5min
  - `passkey_challenge:auth:{sessionId}` → `{ challenge }`, TTL 5min (login usernameless)
  - Cliente: `ioredis` fica **encapsulado no adapter** — use-cases NUNCA injetam `REDIS_CLIENT` cru. Sempre o port `EphemeralStore` (`@common/domain/ports/ephemeral-store.ts`) com adapter `RedisEphemeralStore` (`@common/infrastructure/ephemeral-store/`). Fake in-memory nos testes, swap de provider (KeyDB/Dragonfly/Memcached) = trocar adapter
- **Clock injetável**: use-cases com expiração (`Session.expiresAt`, rotação de refresh, TTL de reset) injetam o port `Clock` (`@common/domain/ports/clock.ts`) — nunca `new Date()` inline. `SystemClock` em prod, `FixedClock` determinístico em teste
- **Ordem de implementação**: senha+JWT → reset de senha por email → Google web → Google nativo → Passkey web → Passkey mobile → hardening
- **SMTP provider**: TBD em MNT-40 (recomendação: Resend — free tier generoso, DX ótima, HTTP API)

## Convenções do arquivo

- IDs `MNT-N` são globais e crescentes — cada task vira um ticket / prefixo de branch (`MNT-1/postgres-docker-compose`) e tag de commit (`[MNT-1]`)
- `[T]` TDD obrigatório (teste vermelho antes do código)
- `[S]` sequencial
- `[P]` paralelizável dentro da fase
- `[HUMANO]` só Felipe pode executar (config externa, credenciais, decisão)
- `🛑 HARD STOP` bloqueia tudo abaixo até resolver
- `[OPS]` infra/deploy (não é código do app)
- `[SEC]` toque de segurança — revisão dobrada
- `[DEFERRED]` fica pra depois, marcado pra não esquecer

Após commit, atualizar item pra `[x] ✅ commit \`<hash>\``.

---

## Fase 0 — Fundação (DB + módulos)

Todos `[S]` — cada um depende do anterior.

- [x] **MNT-1** [S] ✅ commit `bb848b0` — `docker-compose.yml` na raiz com **dois serviços**: `postgres:16-alpine` (volume named + healthcheck) e `redis:7-alpine` (volume named + healthcheck, `--appendonly yes` pra durabilidade); `.env.example` do `/api` com `DATABASE_URL` e `REDIS_URL`
- [x] **MNT-2** [S] ✅ commit `5a282a7` — `api/prisma/schema.prisma` inicial (`datasource db` só com `provider = "postgresql"`; Prisma 7 moveu `url` pra `prisma.config.ts` via `defineConfig` + `env("DATABASE_URL")`); scripts `db:generate`, `db:migrate:dev`, `db:migrate:deploy`, `db:migrate:reset` no `api/package.json`. Prisma não tem `revert` — rollback é migration nova. `db:migrate:reset` só pra dev (dropa DB e reaplica tudo)
- [x] **MNT-3** [T][S] ✅ commit `8af8051` — `PrismaService extends PrismaClient` em `src/infrastructure/prisma/prisma.service.ts` (implementa `OnModuleInit`/`OnModuleDestroy` pra `$connect`/`$disconnect`); `PrismaModule` global que exporta `PrismaService` via DI (nunca `db push` em runtime; migrations rodam via CLI ou entrypoint). **Também**: `EphemeralStoreModule` global em `src/@common/infrastructure/ephemeral-store/` — `ioredis` client como provider **interno** ao módulo (`REDIS_CLIENT`, não exportado), inicializado a partir de `REDIS_URL`; port `EphemeralStore` em `src/@common/domain/ports/ephemeral-store.ts` (`get<T>(key)`, `set(key, value, ttlSeconds)`, `getAndDelete<T>(key)` atômico, `delete(key)`); adapter `RedisEphemeralStore` implementando o port; módulo exporta **apenas o token `EPHEMERAL_STORE`** (o port), nunca o client cru. Teste: `InMemoryEphemeralStore` fake respeita TTL via `FixedClock` (MNT-192) — validar `getAndDelete` single-use e expiração
- [x] **MNT-4** [S] ✅ commit `9624e5a` — Skeleton dos módulos `src/auth/` e `src/users/` no padrão Clean Arch (`domain/`, `application/use-cases/`, `infrastructure/repositories/`, DTOs, controller/service). `auth.module.ts` importa `UsersModule`, `EphemeralStoreModule` e `ClockModule` (globais em `@common/`). Use-cases que precisam de Redis injetam o port `EPHEMERAL_STORE`; use-cases com expiração injetam `CLOCK` — nunca o client cru nem `new Date()` inline
- [x] **MNT-192** [T][S] ✅ commit `94b172f` — `ClockModule` global em `src/@common/infrastructure/clock/` — port `Clock` em `src/@common/domain/ports/clock.ts` (`now(): Date`); adapter `SystemClock` (`new Date()`) como default do token `CLOCK`; `FixedClock` (constructor recebe `Date` inicial, método `advance(ms)`) usado nos testes. Motivo: expiração de `Session`, rotação de refresh, TTLs de reset/verify/passkey challenge precisam ser determinísticos em teste sem `sleep` nem mock global do `Date`. Teste: `FixedClock` avança tempo e valida que use-case genérico de expiry rejeita passado / aceita futuro
- [x] **MNT-5** [T][S] ✅ commit `9624e5a` (migration versionada pendente — gerar em ambiente dev via `pnpm db:migrate:dev --name initial`) — Models no `schema.prisma` + primeira migration (**só o que é persistente de longo prazo**): `User` (com `name String @db.VarChar(100)`, `nickname String? @db.VarChar(50)`, `onboardedAt DateTime? @db.Timestamptz`), `Credential`, `Session`, `OAuthAccount`, `PasskeyCredential`. `pnpm db:migrate:dev --name initial` gera a migration SQL versionada em `api/prisma/migrations/`. **Fora daqui** (vão pro Redis, sem tabela): `passkey_challenges`, `password_reset_tokens`, `email_verification_tokens`. Índices via `@@unique`/`@@index`: `users.email` unique, `oauth_accounts (provider, providerId)` unique, `sessions.userId`, `passkey_credentials.credentialId` unique
- [x] **MNT-6** [S] ✅ commit `6898897` — Health check endpoint `/health` valida Postgres **e** Redis (`PING`) — smoke test da fundação

🛑 **HARD STOP**: nenhuma fase abaixo antes do `docker compose up -d` subir Postgres OK, migration **MNT-5** rodar OK e `/health` responder 200.

---

## Fase 1 — Senha + JWT

Bundle grande — commitar em 2 partes: (a) infra de token/hash, (b) use-cases + controller.

### (a) infra

- [x] **MNT-7** [T][S] ✅ commit `a8f6474` — `PasswordHasher` port (`domain/`) + adapter Argon2id (`infrastructure/`); teste com hash conhecido
- [x] **MNT-8** [T][S] ✅ commit `a8f6474` — `JwtTokenService` — assina access (15m) e refresh (30d) com secrets separados (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`); teste round-trip

### (b) use-cases + rotas

- [x] **MNT-9** [T][S] ✅ commit `9ae0775` — Use-case `SignupWithPassword({ email, password, name })` → valida `name` (1-100 chars, trim, sem HTML); cria `User(email, name)` + `Credential(type='password', hash)`; erro claro em email duplicado. `nickname` e `onboarded_at` ficam NULL — assistente captura no onboarding (`specs/008-onboarding`)
- [x] **MNT-10** [T][S] ✅ commit `18218d2` — Use-case `LoginWithPassword(email, password)` → verifica hash, cria `Session(refreshTokenHash, userAgent, ip, expiresAt)`, retorna par
- [x] **MNT-11** [T][S] ✅ commit `424218c` — Use-case `RefreshTokens(refreshToken)` → localiza Session por hash, valida não-revogada e não-expirada, ROTACIONA (revoga a antiga, cria nova), retorna novo par
- [x] **MNT-12** [T][S] ✅ commit `54e8694` — Use-case `Logout(refreshToken)` → revoga Session
- [x] **MNT-13** [S] ✅ commit `f4c3d9e` — `AuthController`: `POST /auth/signup`, `/login`, `/refresh`, `/logout`. `/refresh` e `/logout` leem o refresh do cookie **ou** do body (mobile)
- [x] **MNT-14** [S] ✅ commit `f4c3d9e` — Set/clear cookie no controller: `HttpOnly + Secure + SameSite=Lax + path=/auth/refresh`
- [x] **MNT-15** [T][S] ✅ commit `f3ca0af` — `JwtAuthGuard` + `@CurrentUser()` decorator; teste endpoint protegido
- [x] **MNT-16** [T][P] ✅ commit `e5ba7c6` — `@nestjs/throttler` — rate limit `5 tentativas / 15min` por IP+email em `/login`, `/signup`, `/refresh`
- [x] **MNT-17** [SEC] ✅ commit `4987380` (primitiva pronta; consumidores futuros — MNT-38 audit log, request-logging middleware — chamam `redactSecrets` antes de logar) — Auditoria de logs: nenhum log contém senha, hash, refresh token completo, ou JWT completo. Só últimos 6 chars do refresh pra correlação. Teste automatizado

---

## Fase 1.5 — Reset de senha por email

Depende da Fase 1. Ativa a possibilidade de recuperar senha esquecida — parte essencial da UX de login por senha, por isso vem antes de OAuth/Passkey.

**Prereq cross-cutting de UI:** `MNT-71` (abaixo) precisa ser feito antes de `MNT-44`. Também bloqueia `MNT-66` (`specs/003-assistant`) e `specs/006-visualizations` inteiro. É a foundation frontend do projeto.

- [ ] **MNT-71** [S] Init shadcn/ui em `/web`: `pnpm dlx shadcn@latest init` (base color neutral, react-server-components on, path `@/components`); adicionar componentes base já esperados — `button`, `input`, `label`, `form`, `dialog`, `radio-group`, `select`, `card`, `avatar`, `tabs`, `scroll-area`, `sonner`. Ajustar `tailwind.config` e `globals.css` conforme output do CLI. Verificar que build passa
- [ ] **MNT-40** 🛑 [HUMANO] Escolher SMTP provider e criar conta. Recomendação: **Resend** (free 3k emails/mês, DX ótima, HTTP API — evita SMTP direto). Alternativas: SendGrid, Mailgun, Amazon SES. Salvar `RESEND_API_KEY` (ou equivalente) e `MAIL_FROM` no `.env`
- [ ] **MNT-41** [T][S] `MailerModule` no `/api` — port `EmailSender` no `domain/`, adapter Resend/SMTP no `infrastructure/`. Config via `ConfigService`. Teste com adapter mock
- [ ] **MNT-42** [T][S] Template "reset de senha" (HTML + fallback texto) — engine simples (Handlebars ou template string tipado). Renderização testável isolada
- [ ] **MNT-36** [T][S] Use-case `ForgotPassword(email)` — idempotente e **sem revelar existência** (retorna 200 mesmo pra email inexistente); gera token aleatório 32B, armazena `password_reset:{sha256(token)}` → `{ userId }` no Redis com TTL 15min. Use-case `ResetPassword(token, newPassword)` — `GETDEL` a chave (atomicamente single-use), valida existência, atualiza `Credential`, **revoga todas as `Session`** do user. Endpoints `POST /auth/forgot`, `POST /auth/reset`
- [ ] **MNT-43** [T][P] Rate limit em `/auth/forgot`: 3 tentativas / 15min por email + 10 / hora por IP (impede enumeration e spam)
- [ ] **MNT-44** [S] Web UI no `/web`: link "Esqueci minha senha" na tela de login; página `/forgot-password` com input de email e mensagem neutra pós-submit; página `/reset-password?token=...` com form de nova senha + confirmação

---

## Fase 2 — Google OAuth (web)

- [ ] **MNT-18** 🛑 [HUMANO][SEC] Criar OAuth Client no Google Cloud Console (Web); adicionar `http://localhost:3000` e URL de prod em Authorized redirect URIs; salvar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` (nunca no git)
- [ ] **MNT-19** [T][S] `GoogleStrategy` (passport-google-oauth20) + use-case `LoginWithGoogle(idToken, profile)` — se `email_verified=true` e existe User com esse email, LINKA `OAuthAccount`; senão cria User novo populando `name` a partir de `profile.displayName` (fallback `given_name + family_name`). Feature flag `ALLOW_GOOGLE_LINK_BY_EMAIL` (default `true`) — se `false`, exige o user logar primeiro e linkar explicitamente
- [ ] **MNT-20** [S] Rotas `GET /auth/google` (redirect) e `GET /auth/google/callback` — callback reaproveita mesmo pipeline de tokens (emite access+refresh, seta cookie)

---

## Fase 3 — Google Sign-In nativo (Capacitor)

- [ ] **MNT-21** 🛑 [HUMANO] OAuth Client Android + iOS no Google Cloud (SHA-1 do keystore Android; Bundle ID iOS)
- [ ] **MNT-22** [S] Plugin `@codetrix-studio/capacitor-google-auth` (avaliar alternativa `@capacitor-firebase/authentication` se Firebase entrar no stack); config no `capacitor.config.ts`
- [ ] **MNT-23** [T][S] Endpoint `POST /auth/google/native` — recebe `idToken` do app, valida via `google-auth-library`, chama o mesmo `LoginWithGoogle` use-case (só o adapter de entrada muda)

---

## Fase 4 — Passkey (web)

- [x] **MNT-24** [S] ✅ commit `70290b5` — `@simplewebauthn/server` no `/api`, `@simplewebauthn/browser` no `/web` (browser fica pra MNT-30)
- [x] **MNT-25** [T][S] ✅ commit `70290b5` — Use-case `EnrollPasskeyBegin(userId)` → gera challenge via `@simplewebauthn/server`, armazena `passkey_challenge:enroll:{userId}` → `{ challenge }` no Redis TTL 5min, retorna options
- [x] **MNT-26** [T][S] ✅ commit `8f708c0` — Use-case `EnrollPasskeyFinish(userId, response)` → `GETDEL` challenge do Redis, verifica, cria `PasskeyCredential` no Postgres
- [x] **MNT-27** [T][S] ✅ commit `5e66bf7` — Use-case `AuthPasskeyBegin(email?)` → usernameless por padrão (`allowCredentials: []`); armazena `passkey_challenge:auth:{sessionId}` → `{ challenge }` no Redis TTL 5min. Retorna `sessionId` opaco + options
- [x] **MNT-28** [T][S] ✅ commit `ee7d8af` — Use-case `AuthPasskeyFinish(sessionId, response)` → `GETDEL` challenge do Redis, verifica, atualiza `counter` do `PasskeyCredential`, emite tokens
- [x] **MNT-29** [S] ✅ commit `ea69238` — Endpoints `POST /auth/passkey/enroll/{begin,finish}`, `/auth/passkey/login/{begin,finish}`
- [ ] **MNT-30** [S] Client web: hook `usePasskey()` empacotando `@simplewebauthn/browser`

---

## Fase 5 — Passkey em Capacitor

- [ ] **MNT-31** 🛑 [HUMANO][OPS] Servir `apple-app-site-association` (iOS) e `assetlinks.json` (Android) em `https://<api-domain>/.well-known/` — exige API em HTTPS com domínio próprio (não localhost)
- [ ] **MNT-32** [S] `capacitor.config.ts`: `ios.associatedDomains` + Android `intentFilters` apontando pro domínio da API
- [ ] **MNT-33** [T][S] `rpID = api-domain` (não `localhost`); testar enroll + login em device físico iOS e Android
- [ ] **MNT-34** [DEFERRED] Fallback UX se device não suporta WebAuthn — mensagem clara + oferta de fallback pra senha/Google

---

## Fase 6 — Hardening + recovery

Todas `[P]` — podem ser feitas em qualquer ordem depois da Fase 1.

- [ ] **MNT-35** [T][P] Email verification: token aleatório single-use, armazenado `email_verification:{sha256(token)}` → `{ userId }` no Redis com TTL 24h; endpoint `/auth/verify-email` faz `GETDEL` atomicamente. Reaproveita `MailerModule` (MNT-41) e template pattern. Feature flag `REQUIRE_VERIFIED_EMAIL` (default `false`)
- [x] **MNT-37** [T][P] ✅ commit `abd89a2` — "Sign out everywhere" — revoga todas as `Session` do user; obrigatório também em troca de senha
- [x] **MNT-38** [T][P] ✅ commit `88717b3` — Audit log: `login_success`, `login_failure`, `passkey_enrolled`, `oauth_linked`, `password_changed`, `all_sessions_revoked` — tabela `auth_audit_log`
- [ ] **MNT-39** [SEC] Pen test manual: brute-force real (com throttler ativo), timing attack no lookup de email (usar `constant-time compare` no email → hash de credential), refresh token reuse (uso de refresh já rotacionado dispara revogação de toda a sessão)

---

## Dependências externas antes da Fase 2+

| Dep | Onde | Quando bloqueia |
|-----|------|-----------------|
| OAuth Client Google (web) | Google Cloud Console | Fase 2 (MNT-18) |
| OAuth Client Google (Android+iOS) | Google Cloud Console | Fase 3 (MNT-21) |
| Domínio HTTPS da API | Provedor DNS + certificado | Fase 5 (MNT-31) |
| SMTP provider | Fase 1.5 (MNT-40) — bloqueia reset de senha | Depois desbloqueia MNT-35 (email verification) na Fase 6 |

## Referências

- [Product Brief](../000-product-brief/spec.md)
- @simplewebauthn: https://simplewebauthn.dev/docs/
- passport-google-oauth20: https://github.com/jaredhanson/passport-google-oauth2
- Argon2id parametrização recomendada: OWASP Password Storage Cheat Sheet
