import { Module } from '@nestjs/common';

import { TransactionsModule } from '../../../finance/transactions/transactions.module';
import { AddCreditPurchaseTool } from './add-credit-purchase.tool';
import { AddCreditPurchasesTool } from './add-credit-purchases.tool';
import { AddTransactionTool } from './add-transaction.tool';
import { AddTransactionsTool } from './add-transactions.tool';
import { DeleteTransactionTool } from './delete-transaction.tool';
import { EditTransactionTool } from './edit-transaction.tool';
import { EditTransactionsTool } from './edit-transactions.tool';
import { ListTransactionsTool } from './list-transactions.tool';

@Module({
  imports: [TransactionsModule],
  providers: [
    ListTransactionsTool,
    AddTransactionTool,
    AddTransactionsTool,
    AddCreditPurchaseTool,
    AddCreditPurchasesTool,
    EditTransactionTool,
    EditTransactionsTool,
    DeleteTransactionTool,
  ],
})
export class TransactionsToolsModule {}
