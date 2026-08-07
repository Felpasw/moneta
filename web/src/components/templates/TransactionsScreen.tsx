"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { Fragment } from "react";

import { EmptyState } from "@/components/molecules/EmptyState";
import transactionsHooks from "@/hooks/useTransactions";
import type { TransactionWithEmbeds } from "@/services/interfaces/transactions.interface";
import { formatBRL, formatBRLSigned, formatRelativeDay } from "@/utils/currency";

const DIRECTION_ICON = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
} as const;

const ROW_TRANSITION = { duration: 0.25, ease: [0.16, 1, 0.3, 1] } as const;

export function TransactionsScreen() {
  const { list } = transactionsHooks.use();
  const { items, summary } = list.data;
  const isEmpty = items.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          History of your most recent activity.
        </p>
      </section>

      {isEmpty && (
        <EmptyState
          title="No transactions yet"
          description="Ask Moneta to register your first transaction to see it here."
        />
      )}

      {!isEmpty && (
        <section
          role="region"
          aria-label="Period summary"
          className="grid grid-cols-3 gap-2 rounded-2xl bg-neutral-900 p-4 text-neutral-50"
        >
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide opacity-60">
              Income
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatBRL(summary.totalIncome)}
            </p>
          </div>
          <div className="border-x border-white/10 text-center">
            <p className="text-[10px] uppercase tracking-wide opacity-60">
              Expenses
            </p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              {formatBRL(summary.totalExpense)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide opacity-60">
              Net
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatBRL(summary.net)}
            </p>
          </div>
        </section>
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
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <DirectionIcon aria-hidden className="h-4 w-4" />
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
