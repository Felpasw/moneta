import { Inject, Injectable } from '@nestjs/common';

import { TransactionType } from '../../domain/constants/transaction-type';
import {
  TRANSACTIONS_REPOSITORY,
  type ListTransactionsFilters,
  type ListTransactionsResult,
  type TransactionWithEmbeds,
  type TransactionsRepository,
  type TransactionsSummary,
} from '../../domain/ports/transactions-repository';

const EMPTY_SUMMARY: TransactionsSummary = {
  totalIncome: 0,
  totalExpense: 0,
  net: 0,
};

function summarize(items: TransactionWithEmbeds[]): TransactionsSummary {
  return items.reduce<TransactionsSummary>((acc, item) => {
    if (item.type === TransactionType.Income) {
      return {
        totalIncome: acc.totalIncome + item.amount,
        totalExpense: acc.totalExpense,
        net: acc.net + item.amount,
      };
    }
    return {
      totalIncome: acc.totalIncome,
      totalExpense: acc.totalExpense + item.amount,
      net: acc.net - item.amount,
    };
  }, EMPTY_SUMMARY);
}

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
  ) {}

  async execute(
    filters: ListTransactionsFilters,
  ): Promise<ListTransactionsResult> {
    const items = await this.transactions.list(filters);
    return { items, summary: summarize(items) };
  }
}
