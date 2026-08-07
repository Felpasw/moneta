import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";
import transactionsService from "@/services/transactions.service";
import type { ListTransactionsResult } from "@/services/interfaces/transactions.interface";

vi.mock("@/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

const LIST_RESULT: ListTransactionsResult = {
  items: [
    {
      id: "t-1",
      userId: "u-1",
      accountId: "acc-1",
      categoryId: "cat-1",
      invoiceId: null,
      type: "expense",
      amount: 120.5,
      description: "Groceries",
      occurredAt: "2026-08-06T10:00:00.000Z",
      account: { id: "acc-1", nickname: "Main", bankName: "Nubank" },
      category: {
        id: "cat-1",
        name: "Groceries",
        icon: "🛒",
        color: "#22c55e",
      },
      signedAmount: -120.5,
    },
  ],
  summary: { totalIncome: 0, totalExpense: 120.5, net: -120.5 },
};

describe("transactionsService", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("list — GET /transactions com params vazios quando sem filtros", async () => {
    mockedGet.mockResolvedValueOnce({ data: LIST_RESULT });

    const result = await transactionsService.list();

    expect(mockedGet).toHaveBeenCalledWith("/transactions", {
      params: undefined,
    });
    expect(result).toEqual(LIST_RESULT);
  });

  it("list — GET /transactions repassa filters como query params", async () => {
    mockedGet.mockResolvedValueOnce({ data: LIST_RESULT });
    const filters = {
      dateFrom: "2026-07-01T00:00:00.000Z",
      dateTo: "2026-07-31T23:59:59.999Z",
      types: ["expense" as const],
      limit: 25,
    };

    await transactionsService.list(filters);

    expect(mockedGet).toHaveBeenCalledWith("/transactions", {
      params: filters,
    });
  });
});
