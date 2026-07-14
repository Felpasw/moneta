# Changelog

Todas as mudanças notáveis do package `api` são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/). Enquanto em `0.x`, breaking changes bumpam minor (não major) — ver `release-please-config.json`.

Manutenção deste arquivo é **automatizada pelo [release-please](https://github.com/googleapis/release-please)**. Não editar manualmente entradas de release — só a versão baseline `[0.1.0]` abaixo é escrita à mão.

## [0.1.0] - 2026-07-14

### Added
- Baseline inicial: NestJS 11 scaffold (Node 24, pnpm)
- Health check `/health` mínimo
- `ConfigModule` global + `ValidationPipe` global + CORS configurável via `WEB_ORIGIN`
