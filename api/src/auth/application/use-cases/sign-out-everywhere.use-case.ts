import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '../../../@common/domain/ports/clock';
import {
  AUTH_AUDIT_LOG_REPOSITORY,
  AuthAuditEventType,
  type AuthAuditLogRepository,
} from '../../domain/ports/auth-audit-log-repository';
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
    @Inject(AUTH_AUDIT_LOG_REPOSITORY)
    private readonly audit: AuthAuditLogRepository,
  ) {}

  async execute(input: SignOutEverywhereInput): Promise<void> {
    await this.sessions.revokeAllByUserId(input.userId, this.clock.now());
    await this.audit.record({
      event: AuthAuditEventType.ALL_SESSIONS_REVOKED,
      userId: input.userId,
    });
  }
}
