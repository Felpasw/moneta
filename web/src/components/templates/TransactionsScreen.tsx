"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Fragment, useMemo } from "react";

import { BankIcon } from "@/components/atoms/BankIcon";
import { BankFilter } from "@/components/molecules/BankFilter";
import { DateRangeFilter } from "@/components/molecules/DateRangeFilter";
import { TransactionTypeFilter } from "@/components/molecules/TransactionTypeFilter";
import type { DateRangeValue } from "@/components/molecules/interfaces/DateRangeFilter.interface";
import { TransactionTypeFilterValue } from "@/components/molecules/interfaces/TransactionTypeFilter.interface";
import { EmptyState } from "@/components/molecules/EmptyState";
import accountsHooks from "@/hooks/useAccounts";
import transactionsHooks from "@/hooks/useTransactions";
import urlParamsHooks from "@/hooks/useUrlParams";
import type { TransactionWithEmbeds } from "@/services/interfaces/transactions.interface";
import { formatBRL, formatBRLSigned, formatRelativeDay } from "@/utils/currency";
import {
  buildTransactionFilters,
  parseIsoDate,
  toIsoDate,
} from "@/utils/transactionFilters";

const DIRECTION_ICON = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
} as const;

const ROW_TRANSITION = { duration: 0.25, ease: [0.16, 1, 0.3, 1] } as const;
const ACCOUNT_IDS_PARAM = "accountIds";
const DATE_FROM_PARAM = "dateFrom";
const DATE_TO_PARAM = "dateTo";
const TYPE_PARAM = "type";

export function TransactionsScreen() {
  const { searchParams, setParam, setListParam, setParams } = urlParamsHooks.use();

  const selectedAccountIds = useMemo(
    () => searchParams.getAll(ACCOUNT_IDS_PARAM),
    [searchParams],
  );

  const dateRange = useMemo<DateRangeValue>(
    () => ({
      from: parseIsoDate(searchParams.get(DATE_FROM_PARAM)),
      to: parseIsoDate(searchParams.get(DATE_TO_PARAM)),
    }),
    [searchParams],
  );

  const typeFilter =
    (searchParams.get(TYPE_PARAM) as TransactionTypeFilterValue | null) ??
    TransactionTypeFilterValue.All;

  const filters = useMemo(
    () =>
      buildTransactionFilters({
        accountIds: selectedAccountIds,
        dateRange,
        type: typeFilter,
      }),
    [selectedAccountIds, dateRange, typeFilter],
  );

  const { list: accountsList } = accountsHooks.use();
  const { list } = transactionsHooks.use(filters);
  const { items, summary } = list.data;
  const isEmpty = items.length === 0;

  const handleFilterChange = (nextSelected: string[]): void =>
    setListParam(ACCOUNT_IDS_PARAM, nextSelected);

  const handleDateRangeChange = (nextRange: DateRangeValue): void =>
    setParams({
      [DATE_FROM_PARAM]: nextRange.from ? toIsoDate(nextRange.from) : null,
      [DATE_TO_PARAM]: nextRange.to ? toIsoDate(nextRange.to) : null,
    });

  const handleTypeChange = (nextType: TransactionTypeFilterValue): void =>
    setParam(
      TYPE_PARAM,
      nextType === TransactionTypeFilterValue.All ? null : nextType,
    );

  const hasFilters =
    selectedAccountIds.length > 0 ||
    dateRange.from !== null ||
    typeFilter !== TransactionTypeFilterValue.All;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          History of your most recent activity.
        </p>
      </section>

      {!isEmpty && (
        <section
          role="region"
          aria-label="Period summary"
          className="grid grid-cols-3 gap-6"
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Income
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              {formatBRL(summary.totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Expenses
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold opacity-70">
              {formatBRL(summary.totalExpense)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Net
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              {formatBRL(summary.net)}
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3 md:gap-10">
        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
          label="Filter by period"
        />
        <TransactionTypeFilter
          value={typeFilter}
          onChange={handleTypeChange}
          label="Filter by type"
        />
        {accountsList.data.items.length > 0 && (
          <BankFilter
            accounts={accountsList.data.items}
            selected={selectedAccountIds}
            onChange={handleFilterChange}
            label="Filter by bank"
            maxVisible={5}
          />
        )}
      </div>

      {isEmpty && (
        <EmptyState
          title={hasFilters ? "No transactions in selection" : "No transactions yet"}
          description={
            hasFilters
              ? "Clear the filters or adjust the range to see other transactions."
              : "Ask Moneta to register your first transaction to see it here."
          }
        />
      )}

      {!isEmpty && (
        <section
          aria-label="Transactions list"
          className="flex flex-col gap-2"
        >
          {items.map((tx, idx) => (
            <Fragment key={tx.id}>
              {items[idx - 1]?.dayGroupKey !== tx.dayGroupKey && (
                <p className="mt-4 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground first:mt-0">
                  {formatRelativeDay(new Date(tx.occurredAt))}
                </p>
              )}
              <TransactionRow tx={tx} index={idx} />
            </Fragment>
          ))}
        </section>
      )}
    </main>
  );
}

interface TransactionRowProps {
  tx: TransactionWithEmbeds;
  index: number;
}

function TransactionRow({ tx, index }: TransactionRowProps) {
  const DirectionIcon = DIRECTION_ICON[tx.type];
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ROW_TRANSITION, delay: index * 0.02 }}
      className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-3 text-neutral-50"
    >
      <div className="relative size-10 shrink-0 overflow-visible">
        <BankIcon
          bankName={tx.account.bankName}
          size={40}
          className="h-10 w-10 rounded-xl"
        />
        <div
          data-type={tx.type}
          className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-neutral-900 ring-2 ring-neutral-900 data-[type=income]:bg-emerald-500/90 data-[type=expense]:bg-rose-500/90"
        >
          <DirectionIcon aria-hidden className="h-3 w-3 text-white" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {tx.description ?? "—"}
        </p>
        <p className="truncate text-xs opacity-60">
          {tx.category?.name ?? "Uncategorized"} · {tx.account.nickname}
        </p>
      </div>
      <p
        data-type={tx.type}
        className="shrink-0 text-sm font-semibold tabular-nums data-[type=expense]:opacity-70"
      >
        {formatBRLSigned(tx.signedAmount)}
      </p>
    </motion.article>
  );
}

export default TransactionsScreen;
