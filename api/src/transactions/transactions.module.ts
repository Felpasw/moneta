import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AddTransactionUseCase } from './application/use-cases/add-transaction.use-case';
import { DeleteTransactionUseCase } from './application/use-cases/delete-transaction.use-case';
import { EditTransactionUseCase } from './application/use-cases/edit-transaction.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { TRANSACTIONS_REPOSITORY } from './domain/ports/transactions-repository';
import { PrismaTransactionsRepository } from './infrastructure/repositories/prisma-transactions.repository';
import { TransactionsController } from './transactions.controller';

@Module({
  imports: [AuthModule],
  controllers: [TransactionsController],
  providers: [
    {
      provide: TRANSACTIONS_REPOSITORY,
      useClass: PrismaTransactionsRepository,
    },
    ListTransactionsUseCase,
    AddTransactionUseCase,
    EditTransactionUseCase,
    DeleteTransactionUseCase,
  ],
  exports: [
    ListTransactionsUseCase,
    AddTransactionUseCase,
    EditTransactionUseCase,
    DeleteTransactionUseCase,
  ],
})
export class TransactionsModule {}
