# Autenticação (MNT-1 … MNT-44)

## Decisões (inline, sem ADR separado a pedido do Felipe)

- **Pattern**: Passport strategies + JWT híbrido
- **Access token**: JWT, 15 min, sempre no header `Authorization: Bearer`
- **Refresh token**: 30 dias, rotativo (novo a cada refresh, session antiga revogada)
  - Web: cookie `HttpOnly + Secure + SameSite=Lax`, `path=/auth/refresh`
  - Mobile (Capacitor): `@capacitor/preferences` + secure storage nativo
- **Hash de senha**: Argon2id (memoryCost=19456, timeCost=2, parallelism=1)
- **DB**: Postgres 16 via docker-compose + TypeORM + migrations manuais (`synchronize: false`)
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

- [ ] **MNT-1** [S] `docker-compose.yml` na raiz com serviço `postgres:16-alpine`, volume named, healthcheck; `.env.example` do `/api` com `DATABASE_URL`
- [ ] **MNT-2** [S] `src/config/data-source.ts` (TypeORM DataSource pra migrations); scripts `migration:generate`, `migration:run`, `migration:revert` no `package.json`
- [ ] **MNT-3** [S] `TypeOrmModule.forRootAsync` no `AppModule` via `ConfigService` (nunca `synchronize: true`)
- [ ] **MNT-4** [S] Skeleton dos módulos `src/auth/` e `src/users/` no padrão Clean Arch (`domain/`, `application/use-cases/`, `infrastructure/repositories/`, DTOs, controller/service). `auth.module.ts` importa `UsersModule`
- [ ] **MNT-5** [T][S] Entities + primeira migration: `users`, `credentials`, `sessions`, `oauth_accounts`, `passkey_credentials`, `passkey_challenges`, `password_reset_tokens`, `email_verification_tokens`. Índices em `users.email` unique, `oauth_accounts (provider, provider_id)` unique, `sessions.user_id`, `password_reset_tokens.token_hash` unique
- [ ] **MNT-6** [S] Health check endpoint `/health` valida conexão DB — smoke test da fundação

🛑 **HARD STOP**: nenhuma fase abaixo antes do `docker compose up -d` subir Postgres OK, migration **MNT-5** rodar OK e `/health` responder 200.

---

## Fase 1 — Senha + JWT

Bundle grande — commitar em 2 partes: (a) infra de token/hash, (b) use-cases + controller.

### (a) infra

- [ ] **MNT-7** [T][S] `PasswordHasher` port (`domain/`) + adapter Argon2id (`infrastructure/`); teste com hash conhecido
- [ ] **MNT-8** [T][S] `JwtTokenService` — assina access (15m) e refresh (30d) com secrets separados (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`); teste round-trip

### (b) use-cases + rotas

- [ ] **MNT-9** [T][S] Use-case `SignupWithPassword(email, password)` → cria `User` + `Credential(type='password', hash)`; erro claro em email duplicado
- [ ] **MNT-10** [T][S] Use-case `LoginWithPassword(email, password)` → verifica hash, cria `Session(refreshTokenHash, userAgent, ip, expiresAt)`, retorna par
- [ ] **MNT-11** [T][S] Use-case `RefreshTokens(refreshToken)` → localiza Session por hash, valida não-revogada e não-expirada, ROTACIONA (revoga a antiga, cria nova), retorna novo par
- [ ] **MNT-12** [T][S] Use-case `Logout(refreshToken)` → revoga Session
- [ ] **MNT-13** [S] `AuthController`: `POST /auth/signup`, `/login`, `/refresh`, `/logout`. `/refresh` e `/logout` leem o refresh do cookie **ou** do body (mobile)
- [ ] **MNT-14** [S] Set/clear cookie no controller: `HttpOnly + Secure + SameSite=Lax + path=/auth/refresh`
- [ ] **MNT-15** [T][S] `JwtAuthGuard` + `@CurrentUser()` decorator; teste endpoint protegido
- [ ] **MNT-16** [T][P] `@nestjs/throttler` — rate limit `5 tentativas / 15min` por IP+email em `/login`, `/signup`, `/refresh`
- [ ] **MNT-17** [SEC] Auditoria de logs: nenhum log contém senha, hash, refresh token completo, ou JWT completo. Só últimos 6 chars do refresh pra correlação. Teste automatizado

---

## Fase 1.5 — Reset de senha por email

Depende da Fase 1. Ativa a possibilidade de recuperar senha esquecida — parte essencial da UX de login por senha, por isso vem antes de OAuth/Passkey.

- [ ] **MNT-40** 🛑 [HUMANO] Escolher SMTP provider e criar conta. Recomendação: **Resend** (free 3k emails/mês, DX ótima, HTTP API — evita SMTP direto). Alternativas: SendGrid, Mailgun, Amazon SES. Salvar `RESEND_API_KEY` (ou equivalente) e `MAIL_FROM` no `.env`
- [ ] **MNT-41** [T][S] `MailerModule` no `/api` — port `EmailSender` no `domain/`, adapter Resend/SMTP no `infrastructure/`. Config via `ConfigService`. Teste com adapter mock
- [ ] **MNT-42** [T][S] Template "reset de senha" (HTML + fallback texto) — engine simples (Handlebars ou template string tipado). Renderização testável isolada
- [ ] **MNT-36** [T][S] Use-case `ForgotPassword(email)` — idempotente e **sem revelar existência** (retorna 200 mesmo pra email inexistente); gera token 15min single-use armazenado hash em `password_reset_tokens`. Use-case `ResetPassword(token, newPassword)` — valida token, atualiza `Credential`, **revoga todas as `Session`** do user. Endpoints `POST /auth/forgot`, `POST /auth/reset`
- [ ] **MNT-43** [T][P] Rate limit em `/auth/forgot`: 3 tentativas / 15min por email + 10 / hora por IP (impede enumeration e spam)
- [ ] **MNT-44** [S] Web UI no `/web`: link "Esqueci minha senha" na tela de login; página `/forgot-password` com input de email e mensagem neutra pós-submit; página `/reset-password?token=...` com form de nova senha + confirmação

---

## Fase 2 — Google OAuth (web)

- [ ] **MNT-18** 🛑 [HUMANO][SEC] Criar OAuth Client no Google Cloud Console (Web); adicionar `http://localhost:3000` e URL de prod em Authorized redirect URIs; salvar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` (nunca no git)
- [ ] **MNT-19** [T][S] `GoogleStrategy` (passport-google-oauth20) + use-case `LoginWithGoogle(idToken, profile)` — se `email_verified=true` e existe User com esse email, LINKA `OAuthAccount`; senão cria User novo. Feature flag `ALLOW_GOOGLE_LINK_BY_EMAIL` (default `true`) — se `false`, exige o user logar primeiro e linkar explicitamente
- [ ] **MNT-20** [S] Rotas `GET /auth/google` (redirect) e `GET /auth/google/callback` — callback reaproveita mesmo pipeline de tokens (emite access+refresh, seta cookie)

---

## Fase 3 — Google Sign-In nativo (Capacitor)

- [ ] **MNT-21** 🛑 [HUMANO] OAuth Client Android + iOS no Google Cloud (SHA-1 do keystore Android; Bundle ID iOS)
- [ ] **MNT-22** [S] Plugin `@codetrix-studio/capacitor-google-auth` (avaliar alternativa `@capacitor-firebase/authentication` se Firebase entrar no stack); config no `capacitor.config.ts`
- [ ] **MNT-23** [T][S] Endpoint `POST /auth/google/native` — recebe `idToken` do app, valida via `google-auth-library`, chama o mesmo `LoginWithGoogle` use-case (só o adapter de entrada muda)

---

## Fase 4 — Passkey (web)

- [ ] **MNT-24** [S] `@simplewebauthn/server` no `/api`, `@simplewebauthn/browser` no `/web`
- [ ] **MNT-25** [T][S] Use-case `EnrollPasskeyBegin(userId)` → gera challenge, salva `PasskeyChallenge`, retorna options
- [ ] **MNT-26** [T][S] Use-case `EnrollPasskeyFinish(userId, response)` → verifica, cria `PasskeyCredential`
- [ ] **MNT-27** [T][S] Use-case `AuthPasskeyBegin(email?)` → usernameless (`allowCredentials: []`) por padrão
- [ ] **MNT-28** [T][S] Use-case `AuthPasskeyFinish(response)` → verifica, atualiza `counter`, emite tokens
- [ ] **MNT-29** [S] Endpoints `POST /auth/passkey/enroll/{begin,finish}`, `/auth/passkey/login/{begin,finish}`
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

- [ ] **MNT-35** [T][P] Email verification: token 24h, endpoint `/auth/verify-email`. Reaproveita `MailerModule` (MNT-41) e template pattern. Feature flag `REQUIRE_VERIFIED_EMAIL` (default `false`)
- [ ] **MNT-37** [T][P] "Sign out everywhere" — revoga todas as `Session` do user; obrigatório também em troca de senha
- [ ] **MNT-38** [T][P] Audit log: `login_success`, `login_failure`, `passkey_enrolled`, `oauth_linked`, `password_changed`, `all_sessions_revoked` — tabela `auth_audit_log`
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

- [Product Brief](../001-product-brief/spec.md)
- @simplewebauthn: https://simplewebauthn.dev/docs/
- passport-google-oauth20: https://github.com/jaredhanson/passport-google-oauth2
- Argon2id parametrização recomendada: OWASP Password Storage Cheat Sheet
