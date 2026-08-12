"use client";

import { motion } from "motion/react";

import type { TopCategoriesChartProps } from "@/components/organisms/interfaces/TopCategoriesChart.interface";
import { formatBRL } from "@/utils/currency";

const BAR_EASE = [0.16, 1, 0.3, 1] as const;

const iconFallback = (name: string): string =>
  name.slice(0, 1).toUpperCase() || "•";

export function TopCategoriesChart({ data }: TopCategoriesChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm opacity-60">
        No expenses recorded this month.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {data.map((category) => (
        <div key={category.id} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-md bg-white/10 text-sm">
              <span aria-hidden>
                {category.icon ?? iconFallback(category.name)}
              </span>
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {category.name}
            </p>
            <p className="shrink-0 text-sm font-semibold tabular-nums opacity-80">
              {formatBRL(category.spent)}
            </p>
          </div>
          <div className="ml-10 h-1 overflow-hidden rounded-full bg-white/15">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${category.sharePct}%` }}
              transition={{ duration: 0.6, ease: BAR_EASE }}
              className="h-full rounded-full bg-white/70"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default TopCategoriesChart;
