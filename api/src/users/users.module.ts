import { Module } from '@nestjs/common';

import { ClockModule } from '../@common/infrastructure/clock/clock.module';
import { AccountsModule } from '../finance/accounts/accounts.module';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case';
import { USERS_REPOSITORY } from './domain/ports/users-repository';
import { PrismaUsersRepository } from './infrastructure/repositories/prisma-users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [ClockModule, AccountsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
    CompleteOnboardingUseCase,
  ],
  exports: [UsersService, USERS_REPOSITORY, CompleteOnboardingUseCase],
})
export class UsersModule {}
