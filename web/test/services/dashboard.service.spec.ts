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
    totalBalance: 5000,
    checkingCount: 2,
    monthIncome: 3000,
    monthExpense: 1500,
    monthNet: 1500,
  },
  topCategories: [
    {
      id: "c-1",
      name: "Food",
      icon: "🍔",
      color: "#f00",
      spent: 500,
      share: 0.33,
    },
  ],
  monthlyFlow: [{ monthKey: "2026-08", income: 3000, expense: 1500 }],
  balanceChart: [{ date: "2026-08-15", balance: 5000 }],
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
