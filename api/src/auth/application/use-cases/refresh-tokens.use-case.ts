import { Inject, Injectable } from '@nestjs/common';

import { MS_PER_SECOND } from '../../../@common/domain/constants/time';
import { CLOCK, type Clock } from '../../../@common/domain/ports/clock';
import {
  InvalidRefreshTokenError,
  InvalidRefreshTokenReason,
} from '../../domain/errors/invalid-refresh-token.error';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepository,
} from '../../domain/ports/sessions-repository';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../domain/services/token-service';
import { JWT_TTL_SECONDS } from '../../infrastructure/constants/jwt';
import { sha256 } from '../../infrastructure/util/sha256';
import type { LoginResult } from '../types/login';
import type { RefreshTokensInput } from '../types/refresh';

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: SessionsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: RefreshTokensInput): Promise<LoginResult> {
    const payload = this.verifyOrThrow(input.refreshToken);
    const session = await this.loadSessionOrThrow(input.refreshToken);
    this.assertOwnership(payload.sub, session.userId);
    this.assertActive(session.revokedAt);
    this.assertNotExpired(session.expiresAt);

    const now = this.clock.now();
    const newRefreshToken = this.tokens.signRefresh({ sub: session.userId });
    const newRefreshTokenHash = sha256(newRefreshToken);
    const newExpiresAt = new Date(
      now.getTime() + JWT_TTL_SECONDS.refresh * MS_PER_SECOND,
    );

    await this.sessions.rotate({
      previousSessionId: session.id,
      next: {
        userId: session.userId,
        refreshTokenHash: newRefreshTokenHash,
        userAgent: input.userAgent,
        ip: input.ip,
        expiresAt: newExpiresAt,
      },
      now,
    });

    const accessToken = this.tokens.signAccess({ sub: session.userId });

    return {
      user: session.user,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  private verifyOrThrow(token: string) {
    try {
      return this.tokens.verifyRefresh(token);
    } catch {
      throw new InvalidRefreshTokenError(
        InvalidRefreshTokenReason.INVALID_SIGNATURE,
      );
    }
  }

  private async loadSessionOrThrow(token: string) {
    const session = await this.sessions.findByRefreshTokenHash(sha256(token));
    if (!session) {
      throw new InvalidRefreshTokenError(
        InvalidRefreshTokenReason.SESSION_NOT_FOUND,
      );
    }
    return session;
  }

  private assertOwnership(payloadSub: string, sessionUserId: string): void {
    if (payloadSub !== sessionUserId) {
      throw new InvalidRefreshTokenError(
        InvalidRefreshTokenReason.USER_MISMATCH,
      );
    }
  }

  private assertActive(revokedAt: Date | null): void {
    if (revokedAt !== null) {
      throw new InvalidRefreshTokenError(
        InvalidRefreshTokenReason.SESSION_REVOKED,
      );
    }
  }

  private assertNotExpired(expiresAt: Date): void {
    if (expiresAt.getTime() <= this.clock.now().getTime()) {
      throw new InvalidRefreshTokenError(
        InvalidRefreshTokenReason.SESSION_EXPIRED,
      );
    }
  }
}
