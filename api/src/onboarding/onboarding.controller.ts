import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/infrastructure/decorators/current-user.decorator';
import type { DecodedToken } from '../auth/domain/services/token-service';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { GetOnboardingStateUseCase } from './application/use-cases/get-onboarding-state.use-case';
import type { OnboardingState } from './domain/types/onboarding-state';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly getOnboardingState: GetOnboardingStateUseCase) {}

  @Get('state')
  async state(@CurrentUser() user: DecodedToken): Promise<OnboardingState> {
    return this.getOnboardingState.execute({ userId: user.sub });
  }
}
