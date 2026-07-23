# Changelog

Todas as mudanças notáveis do package `web` são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/). Enquanto em `0.x`, breaking changes bumpam minor (não major) — ver `release-please-config.json`.

Manutenção deste arquivo é **automatizada pelo [release-please](https://github.com/googleapis/release-please)**. Não editar manualmente entradas de release — só a versão baseline `[0.1.0]` abaixo é escrita à mão.

## [0.2.0](https://github.com/Felpasw/moneta/compare/web-v0.1.0...web-v0.2.0) (2026-07-23)


### ✨ Features

* **auth:** expõe onboardedAt no snapshot + redirect condicional pós-login [MNT-193] ([7d0bbf5](https://github.com/Felpasw/moneta/commit/7d0bbf57d74920cc3a9d0f34c300132140c16bd2))
* **web:** /onboarding conecta WS e toca a fala do agente [MNT-84] ([c376c93](https://github.com/Felpasw/moneta/commit/c376c933e2443d0f6dd388fd9aef599d85a6febd))
* **web:** camada auth (classe + interface single-hook) + atomic design [MNT-193] ([4c4ca21](https://github.com/Felpasw/moneta/commit/4c4ca21a4ed75ce221370f32ac0c07966c35d021))
* **web:** Meter + PasswordStrengthMeter + turbopack root fix [MNT-71] ([867f72c](https://github.com/Felpasw/moneta/commit/867f72c11fae65c6baf59ae0305f4bb2ae6e5cdb))
* **web:** mic capture + MicButton + refactor do useAgentSession [MNT-195] [MNT-196] [MNT-197] ([660ec51](https://github.com/Felpasw/moneta/commit/660ec517acf01696762985f47930c1048f3ee5ce))
* **web:** páginas /login e /signup com hero MONETA e form animado ([4a718cc](https://github.com/Felpasw/moneta/commit/4a718ccfc8569f5baddd9e6c78996c8bb2fcbc51))
* **web:** shadcn init + estrutura base (axios, TanStack Query, Vitest) [MNT-71] ([5aba1ba](https://github.com/Felpasw/moneta/commit/5aba1ba04c94e8da90c9ba9de34bcba302fe3aad))


### 🐛 Correções

* **web:** signup redireciona pra /onboarding em vez de / [MNT-193] ([7b3c89a](https://github.com/Felpasw/moneta/commit/7b3c89ac93ab1f49976c06ae962ebce2351045ca))


### 🔨 Refactoring

* **web:** extract PoweredByFooter atom into global layout [MNT-98] ([38b0df9](https://github.com/Felpasw/moneta/commit/38b0df9de979b83d6c85bd414e533d206cd3247c))

## [0.1.0] - 2026-07-14

### Added
- Baseline inicial: Next.js 16 App Router + Tailwind v4 (Node 24, pnpm)
- Capacitor 8 embutido (`@capacitor/core`, `android`, `ios`, `cli`)
- `capacitor.config.ts` (`appId: app.moneta`) + scripts `build:mobile`, `cap:sync`, `cap:android`, `cap:ios`
- `next.config.ts` com `output: 'export'` + `images: { unoptimized: true }` pra Capacitor consumir `out/`
