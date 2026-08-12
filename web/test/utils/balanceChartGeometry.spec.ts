import { describe, expect, it } from "vitest";

import { computeBalanceChartGeometry } from "@/utils/balanceChartGeometry";

describe("computeBalanceChartGeometry", () => {
  it("returns an empty geometry when the dataset is empty", () => {
    const geo = computeBalanceChartGeometry([]);
    expect(geo).toEqual({
      linePath: "",
      areaPath: "",
      lastPoint: null,
      min: 0,
      max: 0,
    });
  });

  it("maps the first point to x=0 and the last to x=100 (viewbox width)", () => {
    const geo = computeBalanceChartGeometry([
      { date: "2026-08-14", balance: 1000 },
      { date: "2026-08-15", balance: 2000 },
      { date: "2026-08-16", balance: 3000 },
    ]);

    expect(geo.linePath.startsWith("M 0 ")).toBe(true);
    expect(geo.lastPoint?.x).toBe(100);
  });

  it("maps the min balance to y=viewboxHeight and max to y=0", () => {
    const geo = computeBalanceChartGeometry([
      { date: "2026-08-14", balance: 1000 },
      { date: "2026-08-15", balance: 5000 },
    ]);

    expect(geo.min).toBe(1000);
    expect(geo.max).toBe(5000);
    expect(geo.linePath).toBe("M 0 40 L 100 0");
  });

  it("closes the area path back to the baseline on both edges", () => {
    const geo = computeBalanceChartGeometry([
      { date: "2026-08-14", balance: 1000 },
      { date: "2026-08-15", balance: 5000 },
    ]);

    expect(geo.areaPath).toBe("M 0 40 L 100 0 L 100 40 L 0 40 Z");
  });
});
