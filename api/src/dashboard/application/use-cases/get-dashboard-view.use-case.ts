import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '~/@common/domain/ports/clock';
import { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import { GetTopSpentCategoriesUseCase } from '~/finance/categories/application/use-cases/get-top-spent-categories.use-case';
import { ListTransactionsUseCase } from '~/finance/transactions/application/use-cases/list-transactions.use-case';

import type { DashboardView } from '../../domain/types/dashboard-view';

const TOP_CATEGORIES_LIMIT = 5;

@Injectable()
export class GetDashboardViewUseCase {
  constructor(
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly listAccounts: ListMyAccountsUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
    private readonly getTopCategories: GetTopSpentCategoriesUseCase,
  ) {}

  async execute(input: { userId: string }): Promise<DashboardView> {
    const now = this.clock.now();
    const dateFrom = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const dateTo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [accountsResult, transactionsResult, topCategories] =
      await Promise.all([
        this.listAccounts.execute({ userId: input.userId }),
        this.listTransactions.execute({
          userId: input.userId,
          dateFrom,
          dateTo,
          limit: 1,
          offset: 0,
        }),
        this.getTopCategories.execute({
          userId: input.userId,
          dateFrom,
          dateTo,
          limit: TOP_CATEGORIES_LIMIT,
        }),
      ]);

    return {
      summary: {
        totalBalance: accountsResult.summary.totalBalance,
        monthIncome: transactionsResult.summary.totalIncome,
        monthExpense: transactionsResult.summary.totalExpense,
        monthNet: transactionsResult.summary.net,
      },
      topCategories,
    };
  }
}
