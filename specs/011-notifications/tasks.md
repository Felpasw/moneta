# Notificações push proativas — backend (MNT-183..185, MNT-187..190)

> UI (MNT-186 hook `usePushRegistration`, MNT-191 `/settings/notifications`) migrada pra `specs/009-ui-shell/tasks.md`.

## Decisões (inline)

- **Provider**: **Firebase Cloud Messaging (FCM)** — cobre Android e iOS (via APNS por trás dos panos), gratuito, SDK maduro. Alternativa Expo Push? Não — Capacitor tem plugin nativo direto pra FCM
- **Cliente**: `@capacitor/push-notifications` (o oficial). Web só recebe in-app (via SSE/WebSocket) — push web via Web Push API fica DEFERRED
- **Sender**: backend usa `firebase-admin` (SDK oficial) autenticado por service account JSON
- **User controla o que recebe** — tabela `notification_preferences` com toggles + quiet hours (não incomoda entre 22h-8h por default)
- **Regras**: 3 no V1 — fatura fechando, gasto anormal, sessão de assistente longa esquecida. Salário previsto atrasado depende de `expected_day_of_month` que é feature deferred de recurring — pula por ora
- **Dedup**: mesma notificação não dispara 2x — chave `{userId, ruleType, contextId, date}` em Redis TTL 24h

## Depende de

| Item | Spec | Necessário pra |
|------|------|----------------|
| Auth + users | 002-auth | Registrar device token por user |
| Faturas de cartão | 004-transactions Fase 5 | Rule "fatura fechando" |
| Advisory tools (get_spending_pattern) | 007-advisory | Rule "gasto anormal" |
| Deploy do `/api` | 010-deploy-ci | Backend precisa tá em URL fixa pra receber webhook/token |
| `@nestjs/schedule` | 004-transactions Fase 5 | Já tem cron do fechamento de fatura; reusa infra |

## Convenções

Mesmas do resto.

---

## Fase 0 — Setup FCM

- [ ] **MNT-183** 🛑 [HUMANO][SEC] Firebase project + Cloud Messaging habilitado. Gerar service account JSON (Project Settings → Service Accounts → Generate new private key). Salvar como secret no Fly.io: `FIREBASE_SERVICE_ACCOUNT_JSON=<conteúdo do JSON>`. Configurar Android (google-services.json) e iOS (GoogleService-Info.plist) no `/web/android` e `/web/ios` do Capacitor
- [ ] **MNT-184** [T][S] Backend: port `NotificationSender` em `domain/`, adapter `FirebaseNotificationAdapter` em `infrastructure/` (usa `firebase-admin`). Método `send({ token, title, body, data? })`. Config via `ConfigService`. Testes com adapter mock

## Fase 1 — Registro de devices

- [ ] **MNT-185** [T][S] Entity `push_tokens` (id UUID PK, user_id FK ON DELETE CASCADE, platform ENUM `ios`|`android`|`web`, token VARCHAR unique, device_name nullable, last_seen_at, created_at). Endpoints: `POST /notifications/register-device` (auth, body `{ token, platform, deviceName? }` — upsert), `DELETE /notifications/register-device/:id` (logout do device)
- MNT-186 (hook `usePushRegistration()` Capacitor no `AppShell` do `/web`) migrou pra `specs/009-ui-shell/tasks.md`.

## Fase 2 — Rules de disparo

- [ ] **MNT-187** [T][S] Rule **fatura fechando** — worker `@nestjs/schedule` `Cron('0 9 * * *')` diário 9h. Query: faturas `open` cujo `cycle_end` cai amanhã (D-1) ou daqui a 3 dias (D-3). Pra cada match, dispara pra todos os `push_tokens` do user (respeitando `notification_preferences.invoice_reminder`). Título: "Sua fatura {bank} fecha {em N dias}". Body: "Total até agora: R$ X. Vencimento {DD/MM}". Data payload: `{ type: 'invoice_closing', invoiceId }`. Dedup: chave `invoice_reminder:{userId}:{invoiceId}:{D-3 ou D-1}` em Redis
- [ ] **MNT-188** [T][S] Rule **gasto anormal** — mesmo cron. Chama `get_spending_pattern` do advisory (MNT-166) pra cada user+categoria com transactions no último dia. Se `trend='up'` E `gastoDaSemana > 1.5 * mediaSemanal`, dispara. Título: "Gastos altos em {categoria}". Body: "Você gastou R$X essa semana em {categoria}, acima da sua média de R$Y". Data: `{ type: 'spending_alert', categoryId }`. Dedup por semana
- [ ] **MNT-189** [T][S] Rule **sessão longa esquecida** — sanity check anti-esquecimento (você admitiu que fecha manual, mas é rede de segurança). Se uma sessão do assistente tá aberta há mais de 15min, dispara push suave: "Sua sessão do assistente tá aberta há 15min — só lembrete". User pode ignorar. Fica opt-in em `notification_preferences.session_reminder` (default true)

## Fase 3 — Preferências e UI

- [ ] **MNT-190** [T][S] Entity `notification_preferences` (id, user_id FK unique, invoice_reminder BOOL default true, spending_alert BOOL default true, session_reminder BOOL default true, quiet_hours_start TIME default 22:00, quiet_hours_end TIME default 08:00, updated_at). Use-cases `GetPrefs`/`UpdatePrefs`. Endpoint `GET`/`PATCH /notifications/preferences`. Rules checam prefs + quiet hours antes de disparar
- MNT-191 (UI `/settings/notifications` com toggles por rule + range de quiet hours + lista de devices com revogar) migrou pra `specs/009-ui-shell/tasks.md`.

---

## Fora de escopo (V1)

- Push web (browser) via Web Push API — DEFERRED, mobile via FCM basta
- Rich notifications com imagem/action buttons — DEFERRED, texto simples resolve
- Salário previsto atrasado — DEFERRED até `recurring_rules.expected_day_of_month` existir (feature deferred de 005-recurring)
- In-app notification center (histórico) — DEFERRED, push efêmero basta no V1
- Digest semanal por email — DEFERRED, spec própria depois

## Referências

- FCM setup: https://firebase.google.com/docs/cloud-messaging
- @capacitor/push-notifications: https://capacitorjs.com/docs/apis/push-notifications
- firebase-admin: https://www.npmjs.com/package/firebase-admin
- [Transactions faturas](../004-transactions/tasks.md)
- [Advisory patterns](../007-advisory/tasks.md)
