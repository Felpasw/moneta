import { describe, expect, it } from "vitest";

import { TransactionTypeFilterValue } from "@/components/molecules/interfaces/TransactionTypeFilter.interface";
import {
  buildTransactionFilters,
  parseIsoDate,
  toEndOfDayUtc,
  toIsoDate,
  toStartOfDayUtc,
} from "@/utils/transactionFilters";

describe("buildTransactionFilters", () => {
  it("retorna undefined quando nenhum filtro tem valor", () => {
    expect(
      buildTransactionFilters({
        accountIds: [],
        dateRange: { from: null, to: null },
        type: TransactionTypeFilterValue.All,
      }),
    ).toBeUndefined();
  });

  it("inclui accountIds quando array tem elementos", () => {
    const result = buildTransactionFilters({
      accountIds: ["a1", "a2"],
      dateRange: { from: null, to: null },
      type: TransactionTypeFilterValue.All,
    });
    expect(result).toEqual({ accountIds: ["a1", "a2"] });
  });

  it("inclui types quando type != All", () => {
    const result = buildTransactionFilters({
      accountIds: [],
      dateRange: { from: null, to: null },
      type: TransactionTypeFilterValue.Income,
    });
    expect(result).toEqual({ types: ["income"] });
  });

  it("converte dateRange.from/to em ISO datetime UTC", () => {
    const from = new Date(2026, 7, 1, 10);
    const to = new Date(2026, 7, 31, 15);
    const result = buildTransactionFilters({
      accountIds: [],
      dateRange: { from, to },
      type: TransactionTypeFilterValue.All,
    });
    expect(result?.dateFrom).toBe("2026-08-01T00:00:00.000Z");
    expect(result?.dateTo).toBe("2026-08-31T23:59:59.999Z");
  });

  it("combina múltiplos filtros no mesmo objeto", () => {
    const result = buildTransactionFilters({
      accountIds: ["a1"],
      dateRange: { from: new Date(2026, 7, 1), to: null },
      type: TransactionTypeFilterValue.Expense,
    });
    expect(result).toEqual({
      accountIds: ["a1"],
      dateFrom: "2026-08-01T00:00:00.000Z",
      types: ["expense"],
    });
  });
});

describe("parseIsoDate", () => {
  it("retorna null quando raw é null", () => {
    expect(parseIsoDate(null)).toBeNull();
  });

  it("retorna null quando raw é string inválida", () => {
    expect(parseIsoDate("not-a-date")).toBeNull();
  });

  it("parseia YYYY-MM-DD pra Date", () => {
    const parsed = parseIsoDate("2026-08-15");
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getUTCFullYear()).toBe(2026);
  });

  it("parseia ISO datetime completo", () => {
    const parsed = parseIsoDate("2026-08-15T10:30:00.000Z");
    expect(parsed?.getUTCHours()).toBe(10);
  });
});

describe("toIsoDate", () => {
  it("formata Date pra YYYY-MM-DD zero-padded", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("toStartOfDayUtc", () => {
  it("retorna ISO datetime no início do dia UTC", () => {
    const date = new Date(2026, 7, 15, 14, 30);
    expect(toStartOfDayUtc(date)).toBe("2026-08-15T00:00:00.000Z");
  });
});

describe("toEndOfDayUtc", () => {
  it("retorna ISO datetime no fim do dia UTC (23:59:59.999)", () => {
    const date = new Date(2026, 7, 15, 8, 0);
    expect(toEndOfDayUtc(date)).toBe("2026-08-15T23:59:59.999Z");
  });
});
