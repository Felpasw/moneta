import { Controller, Get, UseGuards } from '@nestjs/common';

import type { DecodedToken } from '~/auth/domain/services/token-service';
import { CurrentUser } from '~/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';

import { GetDashboardViewUseCase } from './application/use-cases/get-dashboard-view.use-case';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly getView: GetDashboardViewUseCase) {}

  @Get('view')
  async view(@CurrentUser() user: DecodedToken) {
    return this.getView.execute({ userId: user.sub });
  }
}
