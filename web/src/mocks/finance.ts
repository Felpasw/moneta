export interface MonthlyFlowPoint {
  id: string;
  monthLabel: string;
  incomePct: number;
  expensePct: number;
}

export interface BalanceChartView {
  linePath: string;
  areaPath: string;
  lastPoint: { x: number; y: number } | null;
  min: number;
  max: number;
}

export interface TopCategoryShare {
  id: string;
  name: string;
  icon: string;
  spent: number;
  share: number;
}

