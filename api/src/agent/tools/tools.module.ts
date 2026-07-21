import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { AccountsToolsModule } from './accounts/accounts-tools.module';
import { BanksToolsModule } from './banks/banks-tools.module';
import { CardBillingToolsModule } from './card-billing/card-billing-tools.module';
import { CategoriesToolsModule } from './categories/categories-tools.module';
import { ToolDispatcher } from './infrastructure/tool-dispatcher';
import { ToolRegistry } from './infrastructure/tool-registry';
import { TransactionsToolsModule } from './transactions/transactions-tools.module';
import { TransfersToolsModule } from './transfers/transfers-tools.module';

@Global()
@Module({
  imports: [
    DiscoveryModule,
    BanksToolsModule,
    AccountsToolsModule,
    CategoriesToolsModule,
    CardBillingToolsModule,
    TransactionsToolsModule,
    TransfersToolsModule,
  ],
  providers: [ToolRegistry, ToolDispatcher],
  exports: [ToolRegistry, ToolDispatcher],
})
export class ToolsModule {}
