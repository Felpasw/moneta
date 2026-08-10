import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSACTIONS_REPOSITORY,
  type ListTransactionsFilters,
  type ListTransactionsResult,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
  ) {}

  async execute(
    filters: ListTransactionsFilters,
  ): Promise<ListTransactionsResult> {
    const [items, summary] = await Promise.all([
      this.transactions.list(filters),
      this.transactions.summarize(filters),
    ]);
    return { items, summary };
  }
}
