"use client";

import { motion } from "motion/react";

import { HeroShutterText } from "@/components/atoms/HeroShutterText";
import { EmptyState } from "@/components/molecules/EmptyState";
import { KpiCard } from "@/components/molecules/KpiCard";
import accountsHooks from "@/hooks/useAccounts";
import transactionsHooks from "@/hooks/useTransactions";
import { useUserStore } from "@/stores/userStore";
import { formatBRL } from "@/utils/currency";
import { SETTINGS_STAGGER_CONTAINER } from "@/utils/settingsStagger";

const GREETING_FALLBACK = "there";

export function DashboardScreen() {
  const { list: accountsList } = accountsHooks.use();
  const { list: transactionsList } = transactionsHooks.use();
  const user = useUserStore((s) => s.user);

  const { summary: accountsSummary, items: accountItems } = accountsList.data;
  const { summary: transactionsSummary } = transactionsList.data;

  const greetingName = user?.name ?? GREETING_FALLBACK;
  const isEmpty = accountItems.length === 0;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-6 xl:px-10">
      <div className="mb-2 flex flex-col items-center">
        <HeroShutterText
          text="MONETA"
          href="/dashboard"
          textSizeClass="text-5xl sm:text-6xl md:text-7xl"
        />
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
          Hi, {greetingName}
        </p>
      </div>

      {isEmpty && (
        <EmptyState
          className="mt-10"
          title="No accounts yet"
          description="Ask Moneta to add your first bank account to unlock the dashboard."
        />
      )}

      {!isEmpty && (
        <motion.section
          variants={SETTINGS_STAGGER_CONTAINER}
          initial="hidden"
          animate="visible"
          aria-label="Key indicators"
          className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <KpiCard
            label="Total balance"
            value={formatBRL(accountsSummary.totalBalance)}
            hint="Checking accounts combined"
          />
          <KpiCard
            label="Recent income"
            value={formatBRL(transactionsSummary.totalIncome)}
            hint="Latest transactions"
          />
          <KpiCard
            label="Recent expenses"
            value={formatBRL(transactionsSummary.totalExpense)}
            hint="Latest transactions"
            emphasis="secondary"
          />
          <KpiCard
            label="Net"
            value={formatBRL(transactionsSummary.net)}
            hint="Income minus expenses"
            negative={transactionsSummary.net < 0}
          />
        </motion.section>
      )}
    </main>
  );
}

export default DashboardScreen;
