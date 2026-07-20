import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSACTIONS_REPOSITORY,
  type EditTransactionInput,
  type Transaction,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class EditManyTransactionsUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
  ) {}

  async execute(inputs: EditTransactionInput[]): Promise<Transaction[]> {
    return this.transactions.editMany(inputs);
  }
}
