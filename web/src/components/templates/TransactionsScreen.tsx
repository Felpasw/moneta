"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

import {
  MOCK_TRANSACTIONS_SUMMARY,
  MOCK_TRANSACTION_GROUPS,
} from "@/mocks/finance";
import { formatBRL, formatBRLSigned, formatRelativeDay } from "@/utils/currency";

export function TransactionsScreen() {
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          History of your most recent activity.
        </p>
      </section>

      <section
        aria-label="Period summary"
        className="grid grid-cols-3 gap-2 rounded-2xl bg-neutral-900 p-4 text-neutral-50"
      >
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide opacity-60">
            Income
          </p>
          <p className="mt-1 text-sm font-semibold">
            {formatBRL(MOCK_TRANSACTIONS_SUMMARY.income)}
          </p>
        </div>
        <div className="border-x border-white/10 text-center">
          <p className="text-[10px] uppercase tracking-wide opacity-60">
            Expenses
          </p>
          <p className="mt-1 text-sm font-semibold opacity-70">
            {formatBRL(MOCK_TRANSACTIONS_SUMMARY.expense)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide opacity-60">Net</p>
          <p className="mt-1 text-sm font-semibold">
            {formatBRL(MOCK_TRANSACTIONS_SUMMARY.net)}
          </p>
        </div>
      </section>

      <section aria-label="Transactions list" className="flex flex-col gap-6">
        {MOCK_TRANSACTION_GROUPS.map((group, groupIdx) => (
          <div key={group.id} className="flex flex-col gap-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {formatRelativeDay(group.date)}
            </p>
            <ul className="overflow-hidden rounded-2xl bg-neutral-900 text-neutral-50">
              {group.items.map((tx, idx) => {
                const isIncome = tx.direction === "income";
                const DirectionIcon = isIncome ? ArrowDownLeft : ArrowUpRight;
                return (
                  <motion.li
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: groupIdx * 0.04 + idx * 0.02,
                      duration: 0.25,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <DirectionIcon aria-hidden className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {tx.description}
                      </p>
                      <p className="truncate text-xs opacity-60">
                        {tx.categoryName} · {tx.accountNickname}
                      </p>
                    </div>
                    <p
                      data-direction={tx.direction}
                      className="shrink-0 text-sm font-semibold tabular-nums data-[direction=expense]:opacity-70"
                    >
                      {formatBRLSigned(tx.signedAmount)}
                    </p>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}

export default TransactionsScreen;
