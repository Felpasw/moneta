"use client";

import { motion } from "motion/react";

import { EmptyState } from "@/components/molecules/EmptyState";
import { CheckingAccountCard } from "@/components/molecules/CheckingAccountCard";
import { CreditAccountCard } from "@/components/molecules/CreditAccountCard";
import accountsHooks from "@/hooks/useAccounts";
import { formatBRL } from "@/utils/currency";
import { SETTINGS_STAGGER_CONTAINER } from "@/utils/settingsStagger";

export function BanksScreen() {
  const { list } = accountsHooks.use();
  const { items, summary } = list.data;
  const isEmpty = items.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Banks</h1>
        <p className="text-sm text-muted-foreground">
          Your checking accounts and credit cards in one place.
        </p>
      </section>

      {isEmpty && (
        <EmptyState
          title="No bank accounts yet"
          description="Ask Moneta to add your first account to start tracking balances."
        />
      )}

      {!isEmpty && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label="Checking total"
          className="rounded-2xl bg-neutral-900 p-6 text-neutral-50"
        >
          <p className="text-xs uppercase tracking-wide opacity-60">
            Total balance
          </p>
          <p className="mt-1 font-heading text-3xl font-semibold">
            {formatBRL(summary.totalBalance)}
          </p>
          <p className="mt-2 text-xs opacity-60">
            {summary.checkingCount} checking accounts ·{" "}
            {formatBRL(summary.totalOverdraft)} overdraft available
          </p>
        </motion.section>
      )}

      {!isEmpty && (
        <motion.section
          variants={SETTINGS_STAGGER_CONTAINER}
          initial="hidden"
          animate="visible"
          aria-label="Bank accounts list"
          className="grid gap-3 sm:grid-cols-2"
        >
          {items.map((account) =>
            account.creditLimit === null ? (
              <CheckingAccountCard key={account.id} account={account} />
            ) : (
              <CreditAccountCard key={account.id} account={account} />
            ),
          )}
        </motion.section>
      )}
    </main>
  );
}

export default BanksScreen;
