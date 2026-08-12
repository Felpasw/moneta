import type { DashboardMonthlyFlowRow } from "@/services/interfaces/dashboard.interface";

export type MonthlyFlowPct = (value: number) => number;

export function computeMonthlyFlowScale(
  rows: DashboardMonthlyFlowRow[],
): MonthlyFlowPct {
  const max = rows.reduce(
    (acc, d) => Math.max(acc, d.income, d.expense),
    0,
  );
  return (value) => (max > 0 ? (value / max) * 100 : 0);
}
