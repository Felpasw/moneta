export interface DashboardSummary {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
}

export interface DashboardView {
  summary: DashboardSummary;
}
