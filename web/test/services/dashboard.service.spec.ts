import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";
import dashboardService from "@/services/dashboard.service";
import type { DashboardView } from "@/services/interfaces/dashboard.interface";

vi.mock("@/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

const VIEW: DashboardView = {
  summary: {
    totalBalance: "5000.00",
    checkingCount: 2,
    monthIncome: "3000.00",
    monthExpense: "1500.00",
    monthNet: "1500.00",
  },
  topCategories: [
    {
      id: "c-1",
      name: "Food",
      icon: "🍔",
      color: "#f00",
      spent: "500.00",
      sharePct: 33,
    },
  ],
  monthlyFlow: {
    rows: [
      {
        monthKey: "2026-08",
        income: "3000.00",
        expense: "1500.00",
        incomePct: 100,
        expensePct: 50,
      },
    ],
    maxFlow: "3000.00",
  },
  balanceChart: {
    points: [{ date: "2026-08-15", balance: "5000.00" }],
    min: "5000.00",
    max: "5000.00",
    linePath: "M 0 40",
    areaPath: "M 0 40 L 0 40 L 0 40 Z",
    lastPoint: { x: 0, y: 40 },
  },
};

describe("dashboardService", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("getView — GET /dashboard/view retorna o payload da API", async () => {
    mockedGet.mockResolvedValueOnce({ data: VIEW });

    const result = await dashboardService.getView();

    expect(mockedGet).toHaveBeenCalledWith("/dashboard/view");
    expect(result).toEqual(VIEW);
  });
});
