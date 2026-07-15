import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { UsersModule } from '../users/users.module';
import { AuthPasskeyBeginUseCase } from './application/use-cases/auth-passkey-begin.use-case';
import { AuthPasskeyFinishUseCase } from './application/use-cases/auth-passkey-finish.use-case';
import { EnrollPasskeyBeginUseCase } from './application/use-cases/enroll-passkey-begin.use-case';
import { EnrollPasskeyFinishUseCase } from './application/use-cases/enroll-passkey-finish.use-case';
import { LoginWithPasswordUseCase } from './application/use-cases/login-with-password.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case';
import { SignOutEverywhereUseCase } from './application/use-cases/sign-out-everywhere.use-case';
import { SignupWithPasswordUseCase } from './application/use-cases/signup-with-password.use-case';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasskeyController } from './passkey.controller';
import { PASSKEY_CREDENTIALS_REPOSITORY } from './domain/ports/passkey-credentials-repository';
import { SESSIONS_REPOSITORY } from './domain/ports/sessions-repository';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { TOKEN_SERVICE } from './domain/services/token-service';
import { WEBAUTHN_SERVICE } from './domain/services/webauthn-service';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { AUTH_THROTTLER } from './infrastructure/constants/throttler';
import { IpEmailThrottlerGuard } from './infrastructure/guards/ip-email-throttler.guard';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaPasskeyCredentialsRepository } from './infrastructure/repositories/prisma-passkey-credentials.repository';
import { PrismaSessionsRepository } from './infrastructure/repositories/prisma-sessions.repository';
import { SimpleWebAuthnService } from './infrastructure/webauthn/simple-webauthn.service';

@Module({
  imports: [
    UsersModule,
    ThrottlerModule.forRoot([
      { ttl: AUTH_THROTTLER.ttl, limit: AUTH_THROTTLER.limit },
    ]),
  ],
  controllers: [AuthController, PasskeyController],
  providers: [
    AuthService,
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: SESSIONS_REPOSITORY, useClass: PrismaSessionsRepository },
    {
      provide: PASSKEY_CREDENTIALS_REPOSITORY,
      useClass: PrismaPasskeyCredentialsRepository,
    },
    { provide: WEBAUTHN_SERVICE, useClass: SimpleWebAuthnService },
    SignupWithPasswordUseCase,
    LoginWithPasswordUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    SignOutEverywhereUseCase,
    EnrollPasskeyBeginUseCase,
    EnrollPasskeyFinishUseCase,
    AuthPasskeyBeginUseCase,
    AuthPasskeyFinishUseCase,
    JwtAuthGuard,
    IpEmailThrottlerGuard,
  ],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
