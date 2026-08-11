import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '~/@common/domain/ports/clock';
import { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import { ListTransactionsUseCase } from '~/finance/transactions/application/use-cases/list-transactions.use-case';

import type { DashboardView } from '../../domain/types/dashboard-view';

@Injectable()
export class GetDashboardViewUseCase {
  constructor(
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly listAccounts: ListMyAccountsUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
  ) {}

  async execute(input: { userId: string }): Promise<DashboardView> {
    const now = this.clock.now();
    const dateFrom = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const dateTo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [accountsResult, transactionsResult] = await Promise.all([
      this.listAccounts.execute({ userId: input.userId }),
      this.listTransactions.execute({
        userId: input.userId,
        dateFrom,
        dateTo,
        limit: 1,
        offset: 0,
      }),
    ]);

    return {
      summary: {
        totalBalance: accountsResult.summary.totalBalance,
        monthIncome: transactionsResult.summary.totalIncome,
        monthExpense: transactionsResult.summary.totalExpense,
        monthNet: transactionsResult.summary.net,
      },
    };
  }
}
