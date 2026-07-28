import { Injectable } from '@nestjs/common';

import { ListMyAccountsUseCase } from '../../../finance/accounts/application/use-cases/list-my-accounts.use-case';
import { UsersService } from '../../../users/users.service';
import type { OnboardingState } from '../../domain/types/onboarding-state';
import { deriveOnboardingState } from '../../domain/utils/derive-onboarding-state';

interface GetOnboardingStateInput {
  userId: string;
}

@Injectable()
export class GetOnboardingStateUseCase {
  constructor(
    private readonly users: UsersService,
    private readonly listAccounts: ListMyAccountsUseCase,
  ) {}

  async execute(input: GetOnboardingStateInput): Promise<OnboardingState> {
    const [user, accounts] = await Promise.all([
      this.users.findById(input.userId),
      this.listAccounts.execute({ userId: input.userId }),
    ]);
    return deriveOnboardingState({ user, accounts });
  }
}
