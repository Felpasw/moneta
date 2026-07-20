import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSACTIONS_REPOSITORY,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class DeleteTransactionUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<void> {
    return this.transactions.delete(input.id, input.userId);
  }
}
