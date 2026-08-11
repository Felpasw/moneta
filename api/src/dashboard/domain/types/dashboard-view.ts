import type { TopSpentCategory } from '~/finance/categories/domain/ports/categories-repository';

export interface DashboardSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
}

export interface DashboardView {
  summary: DashboardSummary;
  topCategories: TopSpentCategory[];
}
