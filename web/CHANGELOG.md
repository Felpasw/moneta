# Changelog

Todas as mudanças notáveis do package `web` são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/). Enquanto em `0.x`, breaking changes bumpam minor (não major) — ver `release-please-config.json`.

Manutenção deste arquivo é **automatizada pelo [release-please](https://github.com/googleapis/release-please)**. Não editar manualmente entradas de release — só a versão baseline `[0.1.0]` abaixo é escrita à mão.

## [0.6.0](https://github.com/Felpasw/moneta/compare/web-v0.5.0...web-v0.6.0) (2026-08-11)


### ✨ Features

* **web/banks:** consume backend summary + real accounts via Suspense [MNT-103] ([99cbb87](https://github.com/Felpasw/moneta/commit/99cbb8748ebbbc6645d0c370751056ac3c6a34be))
* **web/banks:** render invoice section on CreditAccountCard from backend embed [MNT-103] ([49f7eaf](https://github.com/Felpasw/moneta/commit/49f7eaf30d4f05e76c44baf38dfb8d602471dac5))
* **web/categories:** integrate real backend with CategoryWithUsage shape [MNT-220] ([ff69f10](https://github.com/Felpasw/moneta/commit/ff69f103d7419a8522530facbe1502dbbb0faa00))
* **web/dashboard:** consume backend summaries and drop mock scaffolding [MNT-100] ([e675b99](https://github.com/Felpasw/moneta/commit/e675b99f8681a91074731362e44d7649bbad7eb8))
* **web/dock:** glass effect + active indicator + hover animations [MNT-215] ([e593960](https://github.com/Felpasw/moneta/commit/e5939608bc8a4bb8761efd93fb78b131f611abc5))
* **web/finance:** banks/accounts/categories services + hooks (TDD) [MNT-215] ([a5a704c](https://github.com/Felpasw/moneta/commit/a5a704cf7d734047d85914f86b22708b491264e9))
* **web/settings:** hub navigation + sub-rotas placeholder [MNT-221] ([2dcda23](https://github.com/Felpasw/moneta/commit/2dcda23af1f880eca58dd17698b3703be601985f))
* **web/settings:** tela About real com título shutter + versões do monorepo + links [MNT-222] ([72374a1](https://github.com/Felpasw/moneta/commit/72374a1dcc90bf2f60032814b23a50ca086e02e3))
* **web/shell:** add global assistant organism with capabilities popover [MNT-215] ([7350476](https://github.com/Felpasw/moneta/commit/7350476d048e6c7e131dab67d48ce0a49d7ae5b7))
* **web/shell:** add Tabs primitive + settingsStagger util + polish assistant settings [MNT-215] ([02417fb](https://github.com/Felpasw/moneta/commit/02417fbc94e2256beba64eea1fb64dd3830c507d))
* **web/shell:** adopt Next Suspense boundaries + backend summary contract [MNT-215] ([84a89ed](https://github.com/Felpasw/moneta/commit/84a89ed75e355e0048dee91485773234d38f0b72))
* **web/shell:** global agent session + hydration fix + dock reposition [MNT-215] ([a73547f](https://github.com/Felpasw/moneta/commit/a73547f5b88edc4deedd87054fba64fcecd07719))
* **web/shell:** merge /accounts and /cards into /banks [MNT-215] ([1658901](https://github.com/Felpasw/moneta/commit/1658901e0b85e2bb8339f88aa05dc05f784ab667))
* **web/shell:** shell routes + dumb templates + finance mocks as backend-ready views [MNT-215] ([5d0d284](https://github.com/Felpasw/moneta/commit/5d0d284ba2d9db11e5a2266601644ccc2b227122))
* **web/transactions:** add transactionsService + useTransactions hook [MNT-102] ([7b364fc](https://github.com/Felpasw/moneta/commit/7b364fcb434af09234861c5b1106172536ec8084))
* **web/transactions:** consume real backend via Suspense + day grouping [MNT-102] ([ae014ee](https://github.com/Felpasw/moneta/commit/ae014ee6168e4c5eefac1b96290bae77fa5c37e1))


### 🔨 Refactoring

* **web/settings:** scroll long voice list + center layout [MNT-215] ([411c1d3](https://github.com/Felpasw/moneta/commit/411c1d332ac258f72716fa3624b0cbe98010b72f))

## [0.5.0](https://github.com/Felpasw/moneta/compare/web-v0.4.0...web-v0.5.0) (2026-08-04)


### ✨ Features

* **web/avatar:** expand DiceBear style catalog from 6 to 15 [MNT-66] ([33aab65](https://github.com/Felpasw/moneta/commit/33aab650a7aa2a8a7a9f7359f9dd58ba40a2444c))
* **web:** adiciona atom AssistantAvatar DiceBear [MNT-66] ([5733c85](https://github.com/Felpasw/moneta/commit/5733c852de1e53b3fd362ec24839dcdc7a19b481))
* **web:** adiciona service + hook de personalização do assistente ([627f233](https://github.com/Felpasw/moneta/commit/627f2338ad115d46a5b8051ae34a8885f42f1540))
* **web:** página /settings/assistant com tom, voz e avatar [MNT-66] ([2464cc7](https://github.com/Felpasw/moneta/commit/2464cc7a32f44fc10ee149918c2021c5f4d87597))
* **web:** proxy Next 16 redireciona rota protegida sem cookie [MNT-99] ([b97f572](https://github.com/Felpasw/moneta/commit/b97f572e54e4d8f6038d8a5145ac7ef3775e563b))


### 🐛 Correções

* **web:** add missing dock-tabs component imported since 2464cc7 [MNT-66] ([2b78546](https://github.com/Felpasw/moneta/commit/2b785460c2e13387887766fdd68cc10a815de675))
* **web:** add zustand dep and ripple-cell animation used since 2464cc7 [MNT-66] ([c1e64fb](https://github.com/Felpasw/moneta/commit/c1e64fb5c6b37df2d358fb769fd647cc34c55823))


### 🔨 Refactoring

* **web/agent:** migrate useAgentSession to zustand agentSessionStore [MNT-66] ([84dd6d4](https://github.com/Felpasw/moneta/commit/84dd6d4bcfaa62fce5cb0e11b3a18b6980426397))
* **web/auth:** consome access token via cookie HttpOnly [MNT-66] ([ead54fc](https://github.com/Felpasw/moneta/commit/ead54fcd33030bc3a32db04adc516b7d4f7dd9c0))
* **web/auth:** migrate userManager util to zustand userStore [MNT-66] ([65962c8](https://github.com/Felpasw/moneta/commit/65962c8be3511ae9be34bd93c3ca7eae32225cd6))
* **web:** AppSidebar reuses nameInitials util and Next Link [MNT-66] ([203e453](https://github.com/Felpasw/moneta/commit/203e453c523c45a72bae93a81bc967240a8d0ca1))
* **web:** extract UI logic into hooks and util [MNT-66] ([1114971](https://github.com/Felpasw/moneta/commit/1114971aa98e31e2132ae3f938323be522561e2d))

## [0.4.0](https://github.com/Felpasw/moneta/compare/web-v0.3.0...web-v0.4.0) (2026-07-28)


### ✨ Features

* **web:** add /dashboard route + DashboardScreen template com sidebar [MNT-209] ([7982021](https://github.com/Felpasw/moneta/commit/7982021a683fc25bc73d94677823212fb96ed672))
* **web:** add AppSidebar organism (desktop shell) [MNT-213] ([3002dde](https://github.com/Felpasw/moneta/commit/3002ddeeb74501718dd70ee225e9686449f06155))
* **web:** consumir envelope system.redirect e navegar pro target [MNT-211] ([a3976d2](https://github.com/Felpasw/moneta/commit/a3976d23cdfecd687e818e2acab2fab52e819ead))


### 🔨 Refactoring

* **web:** VoiceOrb reage só ao TTS do agente, remove mic stream [MNT-214] ([acbe926](https://github.com/Felpasw/moneta/commit/acbe926bc189cc48bdc4174262476adc3196638e))

## [0.3.0](https://github.com/Felpasw/moneta/compare/web-v0.2.0...web-v0.3.0) (2026-07-24)


### ✨ Features

* **web:** atom StepIndicator (bolinhas + linha animada + progress bar) [MNT-206] ([d43456a](https://github.com/Felpasw/moneta/commit/d43456a1dec24a8e84dc3895fa84e85e84293cae))
* **web:** BankIcon + useBankIcon hook com logos da @edusites/bancos-brasil [MNT-206] ([15a4f9c](https://github.com/Felpasw/moneta/commit/15a4f9ca244256c553de472ccfb7c54c355dcc9c))
* **web:** destaca cards de banco + orb compact + mostra fecha/vence/cheque especial [MNT-206] ([d12c2c2](https://github.com/Felpasw/moneta/commit/d12c2c28c873b85b0a109001efebf0cabc920b96))
* **web:** OnboardingProgress + template OnboardingScreen + toolEvents no hook [MNT-206] ([c81d8f7](https://github.com/Felpasw/moneta/commit/c81d8f77deeb17dfe1295ad3d1c29aa8e7e88187))
* **web:** sobe StepIndicator pro Hero (perto do MicButton) + reforça fade nos cards [MNT-206] ([1c6ed51](https://github.com/Felpasw/moneta/commit/1c6ed51f00ef0d3ae50d7fc3c8e8dfdb722e33cb))

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
