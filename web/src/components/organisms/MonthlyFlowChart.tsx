"use client";

import { motion } from "motion/react";

import type { MonthlyFlowChartProps } from "@/components/organisms/interfaces/MonthlyFlowChart.interface";

const BAR_EASE = [0.16, 1, 0.3, 1] as const;
const BAR_DURATION = 0.6;
const BAR_STAGGER = 0.05;

export function MonthlyFlowChart({ data }: MonthlyFlowChartProps) {
  return (
    <div>
      <div className="flex h-40 items-end gap-3">
        {data.map((d, i) => (
          <div
            key={d.id}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div className="flex w-full flex-1 items-end justify-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${d.incomePct}%` }}
                transition={{
                  duration: BAR_DURATION,
                  delay: i * BAR_STAGGER,
                  ease: BAR_EASE,
                }}
                className="w-2.5 rounded-t-sm bg-white"
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${d.expensePct}%` }}
                transition={{
                  duration: BAR_DURATION,
                  delay: i * BAR_STAGGER + BAR_STAGGER,
                  ease: BAR_EASE,
                }}
                className="w-2.5 rounded-t-sm bg-white/40"
              />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-60">
              {d.monthLabel}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4 text-[11px] opacity-60">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white" />
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/40" />
          <span>Expenses</span>
        </div>
      </div>
    </div>
  );
}

export default MonthlyFlowChart;
