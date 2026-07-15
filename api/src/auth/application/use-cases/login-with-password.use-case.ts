import { Inject, Injectable } from '@nestjs/common';

import { MS_PER_SECOND } from '../../../@common/domain/constants/time';
import { CLOCK, type Clock } from '../../../@common/domain/ports/clock';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../../users/domain/ports/users-repository';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepository,
} from '../../domain/ports/sessions-repository';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../domain/services/password-hasher';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../domain/services/token-service';
import { JWT_TTL_SECONDS } from '../../infrastructure/constants/jwt';
import { sha256 } from '../../infrastructure/util/sha256';
import type { LoginResult, LoginWithPasswordInput } from '../types/login';

@Injectable()
export class LoginWithPasswordUseCase {
  constructor(
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: SessionsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: LoginWithPasswordInput): Promise<LoginResult> {
    const email = input.email.toLowerCase().trim();

    const record = await this.users.findByEmailWithPasswordCredential(email);
    if (!record) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.hasher.verify(
      record.passwordHash,
      input.password,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const refreshToken = this.tokens.signRefresh({ sub: record.id });
    const refreshTokenHash = sha256(refreshToken);
    const expiresAt = new Date(
      this.clock.now().getTime() + JWT_TTL_SECONDS.refresh * MS_PER_SECOND,
    );

    await this.sessions.create({
      userId: record.id,
      refreshTokenHash,
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt,
    });

    const accessToken = this.tokens.signAccess({ sub: record.id });

    return {
      user: { id: record.id, email: record.email, name: record.name },
      accessToken,
      refreshToken,
    };
  }
}
