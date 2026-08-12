import { describe, expect, it } from "vitest";

import { computeMonthlyFlowScale } from "@/utils/monthlyFlowScale";

describe("computeMonthlyFlowScale", () => {
  it("scales values against the max income/expense in the dataset", () => {
    const pct = computeMonthlyFlowScale([
      { monthKey: "2026-06", income: 3000, expense: 1500 },
      { monthKey: "2026-07", income: 2000, expense: 4000 },
    ]);

    expect(pct(4000)).toBe(100);
    expect(pct(2000)).toBe(50);
    expect(pct(0)).toBe(0);
  });

  it("returns 0 for every value when the dataset is empty", () => {
    const pct = computeMonthlyFlowScale([]);
    expect(pct(1000)).toBe(0);
    expect(pct(0)).toBe(0);
  });

  it("returns 0 when max is zero (all rows zeroed)", () => {
    const pct = computeMonthlyFlowScale([
      { monthKey: "2026-06", income: 0, expense: 0 },
    ]);
    expect(pct(0)).toBe(0);
  });
});
