export interface DashboardSummary {
  totalBalance: string;
  checkingCount: number;
  monthIncome: string;
  monthExpense: string;
  monthNet: string;
}

export interface DashboardTopCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  spent: string;
  sharePct: number;
}

export interface DashboardMonthlyFlowRow {
  monthKey: string;
  income: string;
  expense: string;
  incomePct: number;
  expensePct: number;
}

export interface DashboardMonthlyFlow {
  rows: DashboardMonthlyFlowRow[];
  maxFlow: string;
}

export interface DashboardBalancePoint {
  date: string;
  balance: string;
}

export interface DashboardBalanceChartLastPoint {
  x: number;
  y: number;
}

export interface DashboardBalanceChart {
  points: DashboardBalancePoint[];
  min: string;
  max: string;
  linePath: string;
  areaPath: string;
  lastPoint: DashboardBalanceChartLastPoint | null;
}

export interface DashboardView {
  summary: DashboardSummary;
  topCategories: DashboardTopCategory[];
  monthlyFlow: DashboardMonthlyFlow;
  balanceChart: DashboardBalanceChart;
}

export interface IDashboardService {
  getView(): Promise<DashboardView>;
}
