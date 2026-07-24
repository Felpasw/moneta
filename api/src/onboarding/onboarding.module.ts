import { Module } from '@nestjs/common';

import { ClockModule } from '../@common/infrastructure/clock/clock.module';
import { AccountsModule } from '../finance/accounts/accounts.module';
import { UsersModule } from '../users/users.module';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case';

@Module({
  imports: [ClockModule, UsersModule, AccountsModule],
  providers: [CompleteOnboardingUseCase],
  exports: [CompleteOnboardingUseCase],
})
export class OnboardingModule {}
