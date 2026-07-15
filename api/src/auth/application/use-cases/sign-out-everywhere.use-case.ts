import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '../../../@common/domain/ports/clock';
import {
  SESSIONS_REPOSITORY,
  type SessionsRepository,
} from '../../domain/ports/sessions-repository';
import type { SignOutEverywhereInput } from '../types/sign-out';

@Injectable()
export class SignOutEverywhereUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: SessionsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: SignOutEverywhereInput): Promise<void> {
    await this.sessions.revokeAllByUserId(input.userId, this.clock.now());
  }
}
