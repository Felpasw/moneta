import { Module } from '@nestjs/common';

import { AccountsModule } from './accounts/accounts.module';
import { BanksModule } from './banks/banks.module';
import { CardBillingModule } from './card-billing/card-billing.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';

@Module({
  imports: [
    BanksModule,
    AccountsModule,
    CategoriesModule,
    CardBillingModule,
    TransactionsModule,
    TransfersModule,
  ],
  exports: [
    BanksModule,
    AccountsModule,
    CategoriesModule,
    CardBillingModule,
    TransactionsModule,
    TransfersModule,
  ],
})
export class FinanceModule {}
