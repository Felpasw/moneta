import { Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';
import { AccountsModule } from '~/finance/accounts/accounts.module';
import { CategoriesModule } from '~/finance/categories/categories.module';
import { TransactionsModule } from '~/finance/transactions/transactions.module';

import { GetDashboardViewUseCase } from './application/use-cases/get-dashboard-view.use-case';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AuthModule, AccountsModule, TransactionsModule, CategoriesModule],
  controllers: [DashboardController],
  providers: [GetDashboardViewUseCase],
})
export class DashboardModule {}
