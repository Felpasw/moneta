import type { BalanceChartPoint } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';
import type { TopSpentCategory } from '~/finance/categories/domain/ports/categories-repository';
import type { MonthlyFlowRow } from '~/finance/transactions/domain/ports/transactions-repository';

export interface DashboardSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
}

export interface DashboardView {
  summary: DashboardSummary;
  topCategories: TopSpentCategory[];
  monthlyFlow: MonthlyFlowRow[];
  balanceChart: BalanceChartPoint[];
}
