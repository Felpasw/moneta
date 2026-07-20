import { Module } from '@nestjs/common';

import { AccountsModule } from './accounts/accounts.module';
import { BanksModule } from './banks/banks.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';

@Module({
  imports: [
    BanksModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    TransfersModule,
  ],
  exports: [
    BanksModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    TransfersModule,
  ],
})
export class FinanceModule {}
