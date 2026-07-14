# Moneta

Assistente monetário conversacional. Registra faturas e gastos, informa próximos vencimentos, gera consultas e gráficos dinâmicos a partir de pedidos em linguagem natural.

## Stack

- **`/api`** — NestJS 11 (Node 24)
- **`/web`** — Next.js 16 (App Router, Tailwind v4) + Capacitor (iOS/Android)

## Setup

```bash
# API
cd api && pnpm install && pnpm start:dev

# Web
cd web && pnpm install && pnpm dev
```

## Mobile (Capacitor)

```bash
cd web
pnpm build:mobile        # next build (static export) + cap sync
pnpm cap:android         # abre Android Studio
pnpm cap:ios             # abre Xcode (macOS only)
```

## Portas padrão

- API: `http://localhost:3333`
- Web: `http://localhost:3000`
