# Changelog

Todas as mudanças notáveis do package `api` são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/). Enquanto em `0.x`, breaking changes bumpam minor (não major) — ver `release-please-config.json`.

Manutenção deste arquivo é **automatizada pelo [release-please](https://github.com/googleapis/release-please)**. Não editar manualmente entradas de release — só a versão baseline `[0.1.0]` abaixo é escrita à mão.

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
