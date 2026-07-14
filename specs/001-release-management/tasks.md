# Versionamento e changelog automático (MNT-149 … MNT-153) — 🔴 **PRIORIDADE ZERO**

> **PRIORIDADE MÁXIMA no backlog.** Fazer **antes** de MNT-1. Motivos:
> - Todo commit daqui pra frente entra no changelog automático se essa infra existir
> - Se implementar depois, todo histórico anterior fica em "0.1.0 initial" — perde granularidade
> - Custa 1 dia de dev, dá tracking limpo pra sempre
> - Bate direto no formato de commit que o CLAUDE.md já obriga (`<tipo>(<escopo>): <descrição>` + `[MNT-N]`)

## Decisões (inline)

- **Ferramenta**: [release-please](https://github.com/googleapis/release-please) do Google — abre uma "Release PR" após merges em `main`, você merge quando quer cortar release
- **Convenção de commit**: Conventional Commits (já é o que CLAUDE.md pede). Tag `[MNT-N]` no fim é compatível — release-please ignora, mas fica no changelog como rastro
- **Versionamento**: **SemVer** independente por package. `/api` e `/web` versionam separado (ex: `api-v0.3.0` enquanto `web` ainda tá em `web-v0.1.0`). Se um commit toca só `/web`, só `/web` bumpa
- **Baseline**: começam ambos em **`0.1.0`** (não `0.0.0` — 0.0.x sugere pre-alpha instável; 0.x indica "em desenvolvimento mas usável")
- **Breaking changes**: `feat!:` ou `BREAKING CHANGE:` no footer bumpa major. Enquanto `0.x`, breaking bumpa minor por convenção SemVer (major só em `1.0.0+`)
- **Enforce**: commitlint + husky bloqueiam commits fora do formato — mais estrito que "trust the humans" pra garantir changelog não fica com buracos

## Como o `MNT-N` se encaixa

Formato de commit do CLAUDE.md:
```
feat(api): setup postgres via docker-compose

Adiciona serviço postgres:16-alpine com volume e healthcheck.
Adiciona também redis:7-alpine para tokens efêmeros.

MNT-1 Setup Postgres + Redis via docker-compose [MNT-1]
```

- `feat(api):` — release-please detecta: minor bump em `api`
- `MNT-1 ... [MNT-1]` no rodapé — vai pro changelog como referência de rastreio

Exemplo de entrada gerada em `api/CHANGELOG.md`:
```markdown
## [0.2.0](.../api-v0.1.0...api-v0.2.0) (2026-08-15)

### Features
* **api:** setup postgres via docker-compose (MNT-1) (abc123)
* **api:** JWT service + refresh token rotation (MNT-8) (def456)

### Bug Fixes
* **api:** fix email dedup case-insensitive (MNT-9) (ghi789)
```

## Depende de

- **Nenhuma outra spec.** É a **primeira coisa** a fazer.

## Convenções

Mesmas do resto. Todas as tasks são `[S]` sequenciais — cada uma depende da anterior.

---

## Fase 0 — Setup

- [x] **MNT-149** [S] ✅ commit `c5bc1fb` — Configuração do release-please:
  - `release-please-config.json` na raiz — declara os 2 packages (`api` e `web`), release type `node`, cada um com changelog próprio
  - `.release-please-manifest.json` — versão atual de cada package. Baseline: `{ "api": "0.1.0", "web": "0.1.0" }`
  - `api/CHANGELOG.md` e `web/CHANGELOG.md` iniciais com header e primeira entrada `0.1.0 — initial baseline`
  - Ajustar `api/package.json` e `web/package.json` pra `"version": "0.1.0"`
- [x] **MNT-150** [S] ✅ commit `7e283b2` — GitHub Actions `.github/workflows/release-please.yml`:
  - Triggers: `push` em `main`, `workflow_dispatch` (manual)
  - Job usa `googleapis/release-please-action@v4`
  - Permissions: `contents: write`, `pull-requests: write`
  - Comportamento: após merge em `main`, abre/atualiza a Release PR; quando Release PR é mergeada, cria tags `api-v0.X.Y` / `web-v0.X.Y` + GitHub Releases com o CHANGELOG como body
- [x] **MNT-151** [S] ✅ commit `7e283b2` — Preview de versão em Pull Requests (nice-to-have mas barato):
  - Workflow separado `.github/workflows/version-preview.yml` que roda em `pull_request` events
  - Usa `release-please-action` em modo preview (`skip-github-release: true`, `skip-tag: true`) pra calcular versão-alvo
  - Comenta no PR: "esse merge vai bumpar `api` de 0.1.0 → 0.2.0 (feat)"
  - Comentário se atualiza a cada push no branch
- [x] **MNT-152** [S] ✅ commit `aadab83` — Enforcement — commitlint + husky:
  - `pnpm add -D -w @commitlint/cli @commitlint/config-conventional husky lint-staged`
  - `commitlint.config.js` com `extends: ['@commitlint/config-conventional']` + regra custom que permite `[MNT-N]` no final do subject sem contar como erro
  - `.husky/commit-msg` roda `pnpm commitlint --edit $1`
  - Commit fora do padrão é bloqueado localmente
  - Fallback CI: workflow `.github/workflows/commitlint.yml` valida commits em PRs (defesa em profundidade se alguém pular o hook local)
- [ ] **MNT-153** [S] [DEFERRED] Documentação em `docs/RELEASING.md` — adiado enquanto projeto for solo. Retomar se entrar colaborador ou se o fluxo for esquecido:
  - Como criar feature branch (`MNT-N/slug`)
  - Como commitar (com exemplos do formato)
  - Como PR e o que esperar do bot (comment de preview, Release PR)
  - Quando é seguro mergear a Release PR (todos os PRs de features prontos)
  - Como fazer hotfix (branch `fix/algo`, PR direto pra main, Release PR cortada rápido)
  - Como forçar release manual em emergência (`workflow_dispatch`)

---

## O que **não** faz parte

- **Publicação em npm registry** — projeto pessoal, não é lib pública. Tags git + GitHub Releases são suficientes
- **Deploy automatizado após release** — CI/CD de deploy é outro spec (a criar quando decidir infra de prod)
- **Changelog público (docs site)** — CHANGELOG.md no repo já basta

## Riscos e mitigações

- **Merge de commits legado (pré-MNT-149) polui changelog** — não vai pra changelog porque release-please pega só commits pós-tag. Baseline `0.1.0 initial` cobre esse pedaço
- **Alguém commita sem seguir formato pelo web UI do GitHub** — commitlint no CI (fase 4 desta lista) bloqueia
- **Release PR fica esquecida aberta** — sem drama, ela se atualiza a cada merge novo. Você merge quando quiser cortar release

## Referências

- release-please docs: https://github.com/googleapis/release-please
- release-please-action: https://github.com/googleapis/release-please-action
- Conventional Commits: https://www.conventionalcommits.org
- commitlint: https://commitlint.js.org
- Exemplo de `release-please-config.json` monorepo: https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md
