import type { BalanceChartResult } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';
import type { TopSpentCategory } from '~/finance/categories/domain/ports/categories-repository';
import type { MonthlyFlowResult } from '~/finance/transactions/domain/ports/transactions-repository';

export interface DashboardSummary {
  totalBalance: string;
  checkingCount: number;
  monthIncome: string;
  monthExpense: string;
  monthNet: string;
}

export interface DashboardView {
  summary: DashboardSummary;
  topCategories: TopSpentCategory[];
  monthlyFlow: MonthlyFlowResult;
  balanceChart: BalanceChartResult;
}
