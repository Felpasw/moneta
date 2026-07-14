# Changelog

Todas as mudanças notáveis do package `web` são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/). Enquanto em `0.x`, breaking changes bumpam minor (não major) — ver `release-please-config.json`.

Manutenção deste arquivo é **automatizada pelo [release-please](https://github.com/googleapis/release-please)**. Não editar manualmente entradas de release — só a versão baseline `[0.1.0]` abaixo é escrita à mão.

## [0.1.0] - 2026-07-14

### Added
- Baseline inicial: Next.js 16 App Router + Tailwind v4 (Node 24, pnpm)
- Capacitor 8 embutido (`@capacitor/core`, `android`, `ios`, `cli`)
- `capacitor.config.ts` (`appId: app.moneta`) + scripts `build:mobile`, `cap:sync`, `cap:android`, `cap:ios`
- `next.config.ts` com `output: 'export'` + `images: { unoptimized: true }` pra Capacitor consumir `out/`
