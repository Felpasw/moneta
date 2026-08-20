# Moneta

[![api version](https://img.shields.io/github/package-json/v/Felpasw/moneta?filename=api/package.json&label=api&color=0ea5e9)](https://github.com/Felpasw/moneta/releases)
[![web version](https://img.shields.io/github/package-json/v/Felpasw/moneta?filename=web/package.json&label=web&color=8b5cf6)](https://github.com/Felpasw/moneta/releases)
[![release-please](https://img.shields.io/github/actions/workflow/status/Felpasw/moneta/release-please.yml?branch=main&label=release-please)](https://github.com/Felpasw/moneta/actions/workflows/release-please.yml)

Conversational money assistant (voice + chat). Records bills and expenses, surfaces upcoming due dates, and generates dynamic queries and charts from natural-language prompts.

**Landing:** [moneta.felipeclacerda.com](https://moneta.felipeclacerda.com)

---

## What it is

Moneta is a personal finance app where the user talks to an assistant (Realtime voice + TTS + 3D avatar) to log activity, check balances, schedule recurrences, and get contextual advice. Every UI action is also exposed as an LLM-invokable *tool* — the backend is the single source of truth; the assistant and the UI are just input surfaces.

## Stack

- **`/api`** — NestJS 11 (Node 24), Prisma 6, Postgres 16, Redis 7, OpenAI Realtime, ElevenLabs, Resend
- **`/web`** — Next.js 16 (App Router, Tailwind v4), shadcn/ui, TanStack Query, Capacitor (iOS/Android), Ready Player Me
- **Infra** — Docker Compose (dev), release-please (versioning), GitHub Actions (CI)

## Setup

```bash
# API
cd api && pnpm install && pnpm start:dev

# Web
cd web && pnpm install && pnpm dev
```

## Default ports

- API: `http://localhost:3333`
- Web: `http://localhost:3000`

## Mobile (Capacitor)

```bash
cd web
pnpm build:mobile        # next build (static export) + cap sync
pnpm cap:android         # opens Android Studio
pnpm cap:ios             # opens Xcode (macOS only)
```

---

## Architecture

### High-level flow

```
 ┌──────────────┐   REST (axios)        ┌──────────────────────┐
 │  /web        │ ────────────────────▶ │  /api  (NestJS)      │
 │  Next.js +   │ ◀──────────────────── │                      │
 │  Capacitor   │        JSON           │  Prisma ▶ Postgres   │
 │              │                       │  Redis (ephemeral)   │
 │              │   WebSocket           │                      │       ┌────────────────────┐
 │              │ ═════════════════════▶│  AgentRealtimeGateway├══════▶│  OpenAI Realtime   │
 │              │  /agent/ws            │   (WS proxy + tools) │◀══════│  (LLM + STT)       │
 │              │ ◀═════════════════════│                      │       └────────────────────┘
 │              │  audio + events       │                      │       ┌────────────────────┐
 │              │                       │                      │──────▶│  ElevenLabs TTS    │
 │              │                       │                      │◀──────│  (HTTP stream)     │
 └──────────────┘                       └──────────────────────┘       └────────────────────┘
                                                  │
                                                  ▼
                                        ┌────────────────────┐
                                        │  Resend (email)    │
                                        └────────────────────┘
```

### `/api` — NestJS with Ports & Adapters

Modules are grouped by **domain**, not by operation:

```
api/src/
├─ agent/                    # assistant: LLM, TTS, tools, personality
│  ├─ application/           # use-cases
│  ├─ domain/                # ports, prompts, types, constants
│  ├─ infrastructure/
│  │  ├─ gateways/           # AgentRealtimeGateway (/agent/ws)
│  │  ├─ llm/                # OpenAI Realtime provider (upstream WS)
│  │  └─ tts/                # ElevenLabs streaming provider
│  ├─ personality/           # avatar, voice, tone profile
│  └─ tools/                 # one folder per domain (accounts, banks, …)
├─ auth/                     # JWT, passkey, OAuth
├─ finance/                  # accounts, banks, card-billing, categories, transactions, transfers
├─ users/, dashboard/, onboarding/, health/
├─ @common/
│  ├─ domain/ports/          # Clock, EphemeralStore (framework-agnostic contracts)
│  └─ infrastructure/        # clock impl, ephemeral-store (Redis), logging, pipes, ws
├─ infrastructure/prisma/    # PrismaService bridging Nest lifecycle + PrismaClient
├─ config/env.ts             # single env entry point
└─ main.ts
```

**Rules**
- Every external side-effect goes through a **port** (interface in `domain/`) with an **adapter** (impl in `infrastructure/`): DB (`PrismaService`), LLM (`RealtimeUpstream`), TTS (`TtsService`), `EphemeralStore`, `EmailSender`, `Clock`
- Use-cases inject the port, never the concrete client or `new Date()`
- Repositories return the port shape via Prisma `select` (nested for relations) — no `.map`/reshape in TS
- Every assistant tool ships a required `playbook: string`; a linter enforces it, and `get_tool_help` loads it on demand
- Cross-module comms: `@Module({ imports })` + exported service, or `EventEmitter` for internal fanout — no reaching into another module's repository

### `/web` — Next.js App Router with Atomic Design

```
web/src/
├─ app/                      # routes, layouts, route groups (auth), providers
├─ components/
│  ├─ atoms/                 # buttons, inputs, icons
│  ├─ molecules/             # composed atoms (BankAvatar, DateRangeFilter, …)
│  ├─ organisms/             # feature-level (LoginForm, OnboardingProgress, …)
│  ├─ templates/             # screens (AppShell, TransactionsScreen, …)
│  └─ ui/                    # shadcn vendored primitives (kebab-case)
├─ hooks/                    # TanStack Query wrappers, useAgentSession, UI hooks
├─ services/                 # class per domain, `export default new Foo()` singleton
├─ stores/                   # global client state
├─ utils/, lib/, i18n/
├─ api.ts                    # axios instance (paramsSerializer indexes: null)
└─ proxy.ts                  # dev proxy for API
```

**Rules**
- No reshape in the client: `.map`/`.reduce` for rename or aggregation is banned. Backend defines the shape (via Prisma `select`) and components consume `account.bank.name` directly
- No `<Thing>ViewModel` mirror types — components accept the service/port type as prop
- Modals use `ModalContext` (`open`, `close`, `payload`) — no local `useState` for modal
- File naming: `.tsx` custom in PascalCase, `.ts` in camelCase, shadcn stays kebab-case

### Realtime socket (`/agent/ws`)

This is the mechanism that ties voice, tools, and state sync together.

**Handshake**
1. Client opens `WebSocket(${API_URL}/agent/ws)` with a JWT (query string or subprotocol)
2. `AgentRealtimeGateway.handleConnection` extracts the token, resolves the user, and rejects with close code `4401` if invalid
3. Gateway opens an **upstream WebSocket** to OpenAI Realtime via the `RealtimeUpstreamFactory` port
4. `wireSystemPrompt` composes the system prompt (personality profile + user's accounts + tool registry) and pushes it upstream on connect

**Bidirectional wiring** (helpers in `agent/infrastructure/gateways/utils/`)
- `wireRelay` — mic frames from client → upstream; LLM text/audio events from upstream → client (transparent proxy for OpenAI Realtime events)
- `wireToolDispatcher` — intercepts `response.function_call_arguments.done` events, resolves the tool via `ToolDispatcher`, and emits back to the client:
  - `tool.pending` — dispatched, awaiting handler
  - `tool.result` — success payload
  - `tool.error` — failure envelope
  - `state.invalidate` — piggybacks on successful mutations to tell the client which entities to refetch
  - `system.redirect` — for tools that navigate the app
- `wireTtsTap` — taps the LLM's assistant text deltas, pipes them into `TtsService` (ElevenLabs HTTP streaming), and forwards chunks as `tts.audio.delta` / `tts.audio.done` / `tts.audio.canceled` / `tts.audio.error`

**Client side** (`web/src/hooks/useAgentSession.ts`)
- Manages the WS lifecycle inside a React ref (survives StrictMode double-invoke)
- `makeStateInvalidateDispatcher` parses `state.invalidate` envelopes and maps each entity to a TanStack Query invalidation, so the UI refetches without any extra wire
- Barge-in cancels the current TTS stream on new mic input (`016-voice-barge-in`)

**Event enum** — `api/src/agent/infrastructure/gateways/constants/agent-socket-events.ts`:
`ToolPending`, `ToolResult`, `ToolError`, `SystemRedirect`, `StateInvalidate`, `TtsAudioDelta`, `TtsAudioDone`, `TtsAudioCanceled`, `TtsAudioError`.

### Persistence

- **Postgres 16** via Prisma (schema in `api/prisma/schema.prisma`, migrations in `api/prisma/migrations/`) — `prisma migrate dev` locally, `prisma migrate deploy` in prod. `db push` is banned in prod
- **Redis 7** for short-lived state (password reset, email verification, passkey challenges) behind the `EphemeralStore` port

---

## Roadmap and specs

Every feature lives in `specs/NNN-slug/` with two files:

- **`spec.md`** — vision, requirements, architectural decisions
- **`tasks.md`** — checklist of `MNT-N` tasks with dependencies and tags (`[T]` TDD, `[S]` sequential, `[P]` parallelizable, `[HUMANO]` human decision, `🛑 HARD STOP`)

Current specs:

| Spec | Theme |
|---|---|
| `000-product-brief` | Overview, scope, global requirements |
| `001-release-management` | release-please, Conventional Commits, versioning |
| `002-auth` | Passkey (WebAuthn), OAuth, hybrid JWT session |
| `003-assistant` | Realtime LLM, ElevenLabs TTS, RPM avatar, playbooks |
| `004-transactions` | CRUD, filters, categories, invoices |
| `005-recurring` | Recurring expenses and income |
| `006-visualizations` | Dynamic charts driven by tool calls |
| `007-advisory` | Contextual financial advice |
| `008-onboarding` | First-run flow + starter snippet |
| `009-ui-shell` | Mobile-first shell (dock, screens, transitions) |
| `010-deploy-ci` | Pipelines and environments |
| `011-notifications` | Push + local |
| `012-import` | CSV/OFX import |
| `013-voice-duplex` | Mic capture + STT streaming |
| `014-dashboard-onboarding-tour` | Interactive tour |
| `015-agent-actions-realtime-sync` | `state.invalidate` broadcast |
| `016-voice-barge-in` | Barge-in / TTS interruption |

---

## Agent workflow (Claude Code)

The repo is tuned for pair-work with Claude Code. Rules live in `CLAUDE.md` (root) and `web/AGENTS.md` — loaded every session.

**Branch per spec**
- Required pattern: `MNT-N/felpa-<slug>` (regex `^[A-Z]+-\d+/felpa-[a-z0-9-]+$`)
- One branch covers a full spec; multiple atomic commits per MNT-N inside it
- `main` is protected — direct commits only with explicit chat authorization

**TDD by default**
- Every code task requires a **red test before** the production code
- Cycle: red → minimum to green → refactor → broader suite stays green
- Exempt: pure migrations, config, scaffolding, static assets, docs

**Commit**
- Conventional Commits: `<type>(<scope>): <description> [MNT-N]`
- The `[MNT-N]` tag at the end of the subject is derived from the branch prefix
- Footer names the task: `MNT-N <task name> [MNT-N]`
- Stage waits for explicit human `ok` — the agent never commits on its own

**Automatic versioning**
- release-please tracks `api` and `web` as independent packages (`.release-please-manifest.json`)
- Every `feat:`/`fix:`/`perf:` merged to `main` feeds an open release PR
- Merging the release PR → tag + `package.json` bump + `CHANGELOG.md` per package
- The badges at the top read `api/package.json` and `web/package.json` from `main` and refresh on their own

**Architecture**
- Backend: Ports & Adapters via NestJS DI (DB, LLM, TTS, EphemeralStore, EmailSender, Clock behind interfaces)
- Frontend: Atomic Design (`atoms` / `molecules` / `organisms` / `templates`), no client-side reshape — the backend defines the shape and components consume it property-direct
- Every assistant tool ships a required `playbook: string` (linter-enforced), loaded on demand via `get_tool_help`

---

## Additional docs

- `CLAUDE.md` — agent instructions (project root)
- `web/AGENTS.md` — `/web`-specific instructions
- `docs/adr/` — Architecture Decision Records
- `specs/NNN-slug/spec.md` — per-feature vision
- `CHANGELOG.md` — generated by release-please (one per package)
