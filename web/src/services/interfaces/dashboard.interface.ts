export interface DashboardSummary {
  totalBalance: number;
  checkingCount: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
}

export interface DashboardTopCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  spent: number;
  share: number;
}

export interface DashboardMonthlyFlowRow {
  monthKey: string;
  income: number;
  expense: number;
}

export interface DashboardBalancePoint {
  date: string;
  balance: number;
}

export interface DashboardView {
  summary: DashboardSummary;
  topCategories: DashboardTopCategory[];
  monthlyFlow: DashboardMonthlyFlowRow[];
  balanceChart: DashboardBalancePoint[];
}

export interface IDashboardService {
  getView(): Promise<DashboardView>;
}
