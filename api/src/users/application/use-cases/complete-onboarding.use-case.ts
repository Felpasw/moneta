import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CLOCK, type Clock } from '../../../@common/domain/ports/clock';
import { ListMyAccountsUseCase } from '../../../finance/accounts/application/use-cases/list-my-accounts.use-case';
import {
  USER_ONBOARDED_EVENT,
  type UserOnboardedPayload,
} from '../../domain/events/user-onboarded.event';
import type { CompleteOnboardingInput } from '../../domain/types/complete-onboarding-input';
import type {
  CompleteOnboardingMissing,
  CompleteOnboardingResult,
} from '../../domain/types/complete-onboarding-result';
import { UsersService } from '../../users.service';

@Injectable()
export class CompleteOnboardingUseCase {
  constructor(
    private readonly users: UsersService,
    private readonly listAccounts: ListMyAccountsUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    input: CompleteOnboardingInput,
  ): Promise<CompleteOnboardingResult> {
    const user = await this.users.findById(input.userId);
    if (user?.onboardedAt) {
      return { ok: true, alreadyOnboarded: true };
    }

    const missing: CompleteOnboardingMissing[] = [];
    if (!user?.nickname) missing.push('nickname');
    const accounts = await this.listAccounts.execute({ userId: input.userId });
    if (accounts.length === 0) missing.push('banks');

    if (missing.length > 0) return { ok: false, missing };

    const { onboardedAt } = await this.users.markOnboarded(
      input.userId,
      this.clock.now(),
    );
    const payload: UserOnboardedPayload = { userId: input.userId, onboardedAt };
    this.events.emit(USER_ONBOARDED_EVENT, payload);
    return { ok: true };
  }
}
