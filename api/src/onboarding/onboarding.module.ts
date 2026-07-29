import { Module } from '@nestjs/common';

import { ClockModule } from '../@common/infrastructure/clock/clock.module';
import { AuthModule } from '../auth/auth.module';
import { AccountsModule } from '../finance/accounts/accounts.module';
import { UsersModule } from '../users/users.module';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case';
import { GetOnboardingStateUseCase } from './application/use-cases/get-onboarding-state.use-case';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [AuthModule, ClockModule, UsersModule, AccountsModule],
  controllers: [OnboardingController],
  providers: [CompleteOnboardingUseCase, GetOnboardingStateUseCase],
  exports: [CompleteOnboardingUseCase, GetOnboardingStateUseCase],
})
export class OnboardingModule {}
