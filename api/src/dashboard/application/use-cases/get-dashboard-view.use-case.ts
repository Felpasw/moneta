import { Inject, Injectable } from '@nestjs/common';

import { CLOCK, type Clock } from '~/@common/domain/ports/clock';
import { GetBalanceChartUseCase } from '~/finance/accounts/application/use-cases/get-balance-chart.use-case';
import { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import { GetTopSpentCategoriesUseCase } from '~/finance/categories/application/use-cases/get-top-spent-categories.use-case';
import { GetMonthlyFlowUseCase } from '~/finance/transactions/application/use-cases/get-monthly-flow.use-case';
import { ListTransactionsUseCase } from '~/finance/transactions/application/use-cases/list-transactions.use-case';

import type { DashboardView } from '../../domain/types/dashboard-view';

const TOP_CATEGORIES_LIMIT = 5;
const MONTHLY_FLOW_MONTHS = 6;
const BALANCE_CHART_DAYS = 30;

@Injectable()
export class GetDashboardViewUseCase {
  constructor(
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly listAccounts: ListMyAccountsUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
    private readonly getTopCategories: GetTopSpentCategoriesUseCase,
    private readonly getMonthlyFlow: GetMonthlyFlowUseCase,
    private readonly getBalanceChart: GetBalanceChartUseCase,
  ) {}

  async execute(input: { userId: string }): Promise<DashboardView> {
    const now = this.clock.now();
    const dateFrom = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const dateTo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [
      accountsResult,
      transactionsResult,
      topCategories,
      monthlyFlow,
      balanceChart,
    ] = await Promise.all([
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
      this.getMonthlyFlow.execute({
        userId: input.userId,
        now,
        monthsBack: MONTHLY_FLOW_MONTHS,
      }),
      this.getBalanceChart.execute({
        userId: input.userId,
        now,
        days: BALANCE_CHART_DAYS,
      }),
    ]);

    return {
      summary: {
        totalBalance: accountsResult.summary.totalBalance.toFixed(2),
        checkingCount: accountsResult.summary.checkingCount,
        monthIncome: transactionsResult.summary.totalIncome.toFixed(2),
        monthExpense: transactionsResult.summary.totalExpense.toFixed(2),
        monthNet: transactionsResult.summary.net.toFixed(2),
      },
      topCategories,
      monthlyFlow,
      balanceChart,
    };
  }
}
