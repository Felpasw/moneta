import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { LoginWithPasswordUseCase } from './application/use-cases/login-with-password.use-case';
import { SignupWithPasswordUseCase } from './application/use-cases/signup-with-password.use-case';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SESSIONS_REPOSITORY } from './domain/ports/sessions-repository';
import { PASSWORD_HASHER } from './domain/services/password-hasher';
import { TOKEN_SERVICE } from './domain/services/token-service';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaSessionsRepository } from './infrastructure/repositories/prisma-sessions.repository';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: SESSIONS_REPOSITORY, useClass: PrismaSessionsRepository },
    SignupWithPasswordUseCase,
    LoginWithPasswordUseCase,
  ],
})
export class AuthModule {}
