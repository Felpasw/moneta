import type { DateRangeValue } from "@/components/molecules/interfaces/DateRangeFilter.interface";
import { TransactionTypeFilterValue } from "@/components/molecules/interfaces/TransactionTypeFilter.interface";
import type { ListTransactionsFilters } from "@/services/interfaces/transactions.interface";

export interface BuildTransactionFiltersInput {
  accountIds: string[];
  dateRange: DateRangeValue;
  type: TransactionTypeFilterValue;
}

export const buildTransactionFilters = ({
  accountIds,
  dateRange,
  type,
}: BuildTransactionFiltersInput): ListTransactionsFilters | undefined => {
  const filters: ListTransactionsFilters = {
    ...(accountIds.length > 0 && { accountIds }),
    ...(dateRange.from && { dateFrom: toStartOfDayUtc(dateRange.from) }),
    ...(dateRange.to && { dateTo: toEndOfDayUtc(dateRange.to) }),
    ...(type !== TransactionTypeFilterValue.All && { types: [type] }),
  };
  return Object.keys(filters).length > 0 ? filters : undefined;
};

export const parseIsoDate = (raw: string | null): Date | null => {
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const toStartOfDayUtc = (date: Date): string =>
  new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();

export const toEndOfDayUtc = (date: Date): string =>
  new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    ),
  ).toISOString();
