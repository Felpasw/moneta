"use client";

import { motion } from "motion/react";

import { HeroShutterText } from "@/components/atoms/HeroShutterText";
import { SectionHeader } from "@/components/atoms/SectionHeader";
import { ChartCard } from "@/components/molecules/ChartCard";
import { KpiCard } from "@/components/molecules/KpiCard";
import { BalanceLineChart } from "@/components/organisms/BalanceLineChart";
import { MonthlyFlowChart } from "@/components/organisms/MonthlyFlowChart";
import { TopCategoriesChart } from "@/components/organisms/TopCategoriesChart";
import { MOCK_DASHBOARD_VIEW } from "@/mocks/finance";
import { formatBRL } from "@/utils/currency";
import { SETTINGS_STAGGER_CONTAINER } from "@/utils/settingsStagger";

export function DashboardScreen() {
  const dashboard = MOCK_DASHBOARD_VIEW;
  const monthLabelLower = dashboard.monthLabel.toLowerCase();

  return (
    <main className="mx-auto w-full max-w-[1600px] px-6 py-6 xl:px-10">
      <div className="mb-2 flex flex-col items-center">
        <HeroShutterText
          text="MONETA"
          href="/dashboard"
          textSizeClass="text-5xl sm:text-6xl md:text-7xl"
        />
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
          Finance panel · {monthLabelLower}
        </p>
      </div>

      <SectionHeader className="mb-3 mt-10">Overview</SectionHeader>
      <motion.section
        variants={SETTINGS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        aria-label="Key indicators"
        className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          label="Total balance"
          value={formatBRL(dashboard.totalBalance)}
          hint="Checking accounts combined"
        />
        <KpiCard
          label="Income this month"
          value={formatBRL(dashboard.income)}
          hint={monthLabelLower}
        />
        <KpiCard
          label="Expenses this month"
          value={formatBRL(dashboard.expense)}
          hint={monthLabelLower}
          emphasis="secondary"
        />
        <KpiCard
          label="Left this month"
          value={formatBRL(dashboard.net)}
          hint="Income minus expenses"
          negative={dashboard.net < 0}
        />
      </motion.section>

      <SectionHeader className="mb-3">Trends</SectionHeader>
      <motion.section
        variants={SETTINGS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        aria-label="Charts"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        <ChartCard label="Last 6 months" title="Monthly flow">
          <MonthlyFlowChart data={dashboard.monthlyFlow} />
        </ChartCard>
        <ChartCard label="Last 30 days" title="Balance over time">
          <BalanceLineChart {...dashboard.balanceChart} />
        </ChartCard>
        <ChartCard
          label={`Top ${dashboard.topCategories.length}`}
          title="Where it's going"
        >
          <TopCategoriesChart data={dashboard.topCategories} />
        </ChartCard>
      </motion.section>
    </main>
  );
}

export default DashboardScreen;
