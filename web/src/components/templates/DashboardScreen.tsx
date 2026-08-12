"use client";

import { motion } from "motion/react";

import { HeroShutterText } from "@/components/atoms/HeroShutterText";
import { EmptyState } from "@/components/molecules/EmptyState";
import { KpiCard } from "@/components/molecules/KpiCard";
import { ChartCard } from "@/components/molecules/ChartCard";
import { BalanceLineChart } from "@/components/organisms/BalanceLineChart";
import { MonthlyFlowChart } from "@/components/organisms/MonthlyFlowChart";
import { TopCategoriesChart } from "@/components/organisms/TopCategoriesChart";
import dashboardHooks from "@/hooks/useDashboard";
import { useUserStore } from "@/stores/userStore";
import { formatBRL } from "@/utils/currency";
import { SETTINGS_STAGGER_CONTAINER } from "@/utils/settingsStagger";

const GREETING_FALLBACK = "there";

export function DashboardScreen() {
  const { view } = dashboardHooks.use();
  const user = useUserStore((s) => s.user);

  const { summary, topCategories, monthlyFlow, balanceChart } = view.data;

  const greetingName = user?.name ?? GREETING_FALLBACK;
  const isEmpty = summary.checkingCount === 0;

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
        <>
          <motion.section
            variants={SETTINGS_STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
            aria-label="Key indicators"
            className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <KpiCard
              label="Total balance"
              value={formatBRL(summary.totalBalance)}
              hint="All accounts combined"
            />
            <KpiCard
              label="Month income"
              value={formatBRL(summary.monthIncome)}
              hint="Current month so far"
            />
            <KpiCard
              label="Month expenses"
              value={formatBRL(summary.monthExpense)}
              hint="Current month so far"
              emphasis="secondary"
            />
            <KpiCard
              label="Net"
              value={formatBRL(summary.monthNet)}
              hint="Income minus expenses"
              negative={summary.monthNet.startsWith("-")}
            />
          </motion.section>

          <section
            aria-label="Balance and cash flow"
            className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <ChartCard label="Last 30 days" title="Balance">
              <BalanceLineChart data={balanceChart} />
            </ChartCard>
            <ChartCard label="Last 6 months" title="Monthly flow">
              <MonthlyFlowChart data={monthlyFlow} />
            </ChartCard>
          </section>

          <section
            aria-label="Top categories"
            className="mt-4 grid grid-cols-1 gap-4"
          >
            <ChartCard label="This month" title="Top categories">
              <TopCategoriesChart data={topCategories} />
            </ChartCard>
          </section>
        </>
      )}
    </main>
  );
}

export default DashboardScreen;
