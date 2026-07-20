import { Module } from '@nestjs/common';

import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../../auth/auth.module';
import { CardBillingModule } from '../card-billing/card-billing.module';
import { AddManyTransactionsUseCase } from './application/use-cases/add-many-transactions.use-case';
import { AddTransactionUseCase } from './application/use-cases/add-transaction.use-case';
import { DeleteTransactionUseCase } from './application/use-cases/delete-transaction.use-case';
import { EditManyTransactionsUseCase } from './application/use-cases/edit-many-transactions.use-case';
import { EditTransactionUseCase } from './application/use-cases/edit-transaction.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { TRANSACTIONS_REPOSITORY } from './domain/ports/transactions-repository';
import { PrismaTransactionsRepository } from './infrastructure/repositories/prisma-transactions.repository';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [AuthModule, AccountsModule, CardBillingModule],
  controllers: [TransactionsController],
  providers: [
    {
      provide: TRANSACTIONS_REPOSITORY,
      useClass: PrismaTransactionsRepository,
    },
    ListTransactionsUseCase,
    AddTransactionUseCase,
    AddManyTransactionsUseCase,
    EditTransactionUseCase,
    EditManyTransactionsUseCase,
    DeleteTransactionUseCase,
  ],
  exports: [
    ListTransactionsUseCase,
    AddTransactionUseCase,
    AddManyTransactionsUseCase,
    EditTransactionUseCase,
    EditManyTransactionsUseCase,
    DeleteTransactionUseCase,
  ],
})
export class TransactionsModule {}
