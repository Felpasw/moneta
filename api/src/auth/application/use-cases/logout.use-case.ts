import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '../../../@common/domain/ports/clock';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepository,
} from '../../domain/ports/sessions-repository';
import { sha256 } from '../../infrastructure/util/sha256';
import type { LogoutInput } from '../types/logout';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: SessionsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.sessions.revokeByRefreshTokenHash(
      sha256(input.refreshToken),
      this.clock.now(),
    );
  }
}
