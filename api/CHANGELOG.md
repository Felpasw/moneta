# Changelog

Todas as mudanças notáveis do package `api` são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/). Enquanto em `0.x`, breaking changes bumpam minor (não major) — ver `release-please-config.json`.

Manutenção deste arquivo é **automatizada pelo [release-please](https://github.com/googleapis/release-please)**. Não editar manualmente entradas de release — só a versão baseline `[0.1.0]` abaixo é escrita à mão.

## [0.3.0](https://github.com/Felpasw/moneta/compare/api-v0.2.0...api-v0.3.0) (2026-07-17)


### ✨ Features

* **agent:** CRUD do assistant_profile com validação avatar RPM [MNT-61] ([d5eeb3b](https://github.com/Felpasw/moneta/commit/d5eeb3b3f71682f5c97e06c956d47fd41ef05e48))
* **agent:** endpoint POST /agent/voices/:voiceId/preview com cache 24h ([5f8efeb](https://github.com/Felpasw/moneta/commit/5f8efeb3916a8089d0a7251df0a4d1a737e402a2))
* **agent:** flag preloadPlaybook opcional em AssistantTool + getPreloadedPlaybooks no registry ([af55737](https://github.com/Felpasw/moneta/commit/af55737cec38264d1beb030d9c88a574fc243051))
* **agent:** gateway WebSocket /agent/ws relay OpenAI Realtime [MNT-50] ([dcf1e47](https://github.com/Felpasw/moneta/commit/dcf1e47f6309b704f9fe286567f648de656cd724))
* **agent:** injeta system prompt no gateway realtime via session.update ([0a91ab6](https://github.com/Felpasw/moneta/commit/0a91ab6df1d3e184bea4d2d1518670aecf19108b))
* **agent:** listVoices no TtsClient + use-case com cache 5min + endpoint [MNT-56] ([93b6fdf](https://github.com/Felpasw/moneta/commit/93b6fdf601cac7fda14b4f7e00f598a6e176c347))
* **agent:** pipeline TTS→client com barge-in no gateway Realtime [MNT-57] ([88d18c8](https://github.com/Felpasw/moneta/commit/88d18c8fc0eb026fe3edc4adc7e659bcd2fd6a63))
* **agent:** registry versionado de system prompt com composição base+treatment ([98cb2fa](https://github.com/Felpasw/moneta/commit/98cb2fa2d7b57a34ab2b074bcdb23136e8478be4))
* **agent:** snippet get_tool_help no system prompt base + scaffold de LLM behavior tests ([58e8045](https://github.com/Felpasw/moneta/commit/58e8045e1e680c55ab3717442e7b16110851ff7c))
* **agent:** submódulo personality com assistant_profile + evento signup [MNT-60] ([b62ed2c](https://github.com/Felpasw/moneta/commit/b62ed2c2f965c52973a4f91964ea6f9ce63aea6d))
* **agent:** submódulos llm/tts, health check e httpClient compartilhado [MNT-47] ([b1433d9](https://github.com/Felpasw/moneta/commit/b1433d9fcfdbb61904160500863a2d37f0abc8be))
* **agent:** TtsClient port + ElevenLabs adapter com streaming HTTP [MNT-55] ([62f2077](https://github.com/Felpasw/moneta/commit/62f20775709e98fff3af61333efa263d9349e7a5))
* **config:** env schema com LLM_API_KEY, TTS_API_KEY, TTS_DEFAULT_VOICE_ID required [MNT-48] ([c48c37d](https://github.com/Felpasw/moneta/commit/c48c37d0a0ba62bd5b86d1f0e7ed9dccd5fa4ef0))
* **tools:** guia + linter build-time de playbooks [MNT-93] ([b9567df](https://github.com/Felpasw/moneta/commit/b9567df676cf9a387d5dc65e1aca856617ee4ec0))
* **tools:** linter cross-ref de playbooks entre tools [MNT-96] ([94b624d](https://github.com/Felpasw/moneta/commit/94b624dcb05326a33b50988770e2cab8ba715c62))
* **tools:** meta-tool get_tool_help com bypass explícito ao dispatcher [MNT-94] ([b5423aa](https://github.com/Felpasw/moneta/commit/b5423aabbf14e46c6c2f8e80a9a0e5d4abd9c663))
* **tools:** ToolDispatcher com timeout e guard de contexto [MNT-53] ([37841e7](https://github.com/Felpasw/moneta/commit/37841e7d221de96b9ffeeeb2924d0205d9e086a5))
* **tools:** ToolRegistry global com descoberta via DiscoveryModule [MNT-52] ([71c9e64](https://github.com/Felpasw/moneta/commit/71c9e643ac0d7665db0eb0b7bce2c47a24f8b119))


### 🔨 Refactoring

* **agent:** rename assistant → agent [MNT-47] ([4b3030b](https://github.com/Felpasw/moneta/commit/4b3030bbada2b2b4a75cc23529888a2e70916f4e))

## [0.2.0](https://github.com/Felpasw/moneta/compare/api-v0.1.0...api-v0.2.0) (2026-07-15)


### ✨ Features

* **@common:** redactor de segredos pra audit log [MNT-17] ([4987380](https://github.com/Felpasw/moneta/commit/4987380095522fd41b0ebd004c77f74b437200b4))
* **api:** adiciona health check /health validando Postgres e Redis [MNT-6] ([6898897](https://github.com/Felpasw/moneta/commit/68988974d17e244d8807a07383732501023fde62))
* **api:** adiciona port Clock com SystemClock e FixedClock [MNT-192] ([94b172f](https://github.com/Felpasw/moneta/commit/94b172f99a6ff10e11e52462a406b041e55cb631))
* **api:** adiciona PrismaModule e EphemeralStoreModule via ports [MNT-3] ([8af8051](https://github.com/Felpasw/moneta/commit/8af805175b95c823419e3f45614a5c34e9cf80a7))
* **auth:** audit log com tabela + events integrados nas use-cases [MNT-38] ([88717b3](https://github.com/Felpasw/moneta/commit/88717b3da465a34dfe9c23fb4323b68b828af1d8))
* **auth:** AuthController + cookie do refresh token [MNT-13] [MNT-14] ([f4c3d9e](https://github.com/Felpasw/moneta/commit/f4c3d9ebd5a21ec3c6e066a778224b8791be6504))
* **auth:** endpoints POST /auth/passkey/{enroll,login}/{begin,finish} [MNT-29] ([ea69238](https://github.com/Felpasw/moneta/commit/ea69238d8e7541db373bdbf8a27875d7e66f4fd6))
* **auth:** JwtAuthGuard + @CurrentUser decorator [MNT-15] ([f3ca0af](https://github.com/Felpasw/moneta/commit/f3ca0af05027014da73cdd9b87317eac2d032f94))
* **auth:** PasswordHasher/Argon2, TokenService/JWT e env centralizado [MNT-7] [MNT-8] ([a8f6474](https://github.com/Felpasw/moneta/commit/a8f6474c37e04fa3751fa7660a25ace4776e8059))
* **auth:** scaffold módulos auth/users e models Prisma [MNT-4] [MNT-5] ([9624e5a](https://github.com/Felpasw/moneta/commit/9624e5aed48a98a4a74c985339df69f8b028e6ed))
* **auth:** throttler 5/15min por IP+email em signup/login/refresh [MNT-16] ([e5ba7c6](https://github.com/Felpasw/moneta/commit/e5ba7c6ac7875b27b14870756a95a79ebc0446be))
* **auth:** use-case AuthPasskeyBegin (usernameless por padrão) [MNT-27] ([5e66bf7](https://github.com/Felpasw/moneta/commit/5e66bf71940770565a0228d38cfad5ca8cfa013b))
* **auth:** use-case AuthPasskeyFinish + counter update + emissão de tokens [MNT-28] ([ee7d8af](https://github.com/Felpasw/moneta/commit/ee7d8af95b46ccf5efaf8a365b964985937aadf9))
* **auth:** use-case EnrollPasskeyBegin (WebAuthn registration options) [MNT-24] [MNT-25] ([70290b5](https://github.com/Felpasw/moneta/commit/70290b5047e51799da3d7c0e68bf100a7f5fc7cf))
* **auth:** use-case EnrollPasskeyFinish (verify + create) [MNT-26] ([8f708c0](https://github.com/Felpasw/moneta/commit/8f708c02f6e0cd426eb63572c021f494c0b7fee8))
* **auth:** use-case LoginWithPassword + SessionsRepository [MNT-10] ([18218d2](https://github.com/Felpasw/moneta/commit/18218d25c0dba9cffd34b92c04e1e78be3eaada4))
* **auth:** use-case Logout (revoga session idempotente) [MNT-12] ([54e8694](https://github.com/Felpasw/moneta/commit/54e86946f64375ee5345ef67421c8afd1389b5f2))
* **auth:** use-case RefreshTokens com rotação atômica [MNT-11] ([424218c](https://github.com/Felpasw/moneta/commit/424218c614891ebd27fba28fb8a291eb6d9e7fda))
* **auth:** use-case SignOutEverywhere + POST /auth/logout-everywhere [MNT-37] ([abd89a2](https://github.com/Felpasw/moneta/commit/abd89a292a9515a13603cce40a28c60456d9ff84))
* **auth:** use-case SignupWithPassword + UsersRepository [MNT-9] ([9ae0775](https://github.com/Felpasw/moneta/commit/9ae07751e9cc948426540986a6883a0a3009fdcd))


### 🔨 Refactoring

* **api:** env como object eager-loaded com dotenv + zod [MNT-8] ([7e7e5d0](https://github.com/Felpasw/moneta/commit/7e7e5d0e858a55602f9f80ed01307700685836b0))

## [0.1.0] - 2026-07-14

### Added
- Baseline inicial: NestJS 11 scaffold (Node 24, pnpm)
- Health check `/health` mínimo
- `ConfigModule` global + `ValidationPipe` global + CORS configurável via `WEB_ORIGIN`
