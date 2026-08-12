"use client";

import { motion } from "motion/react";

import type { BalanceLineChartProps } from "@/components/organisms/interfaces/BalanceLineChart.interface";
import { formatBRL } from "@/utils/currency";

const CHART_VIEWBOX = "0 0 100 40";
const LINE_EASE = [0.16, 1, 0.3, 1] as const;

export function BalanceLineChart({ data }: BalanceLineChartProps) {
  return (
    <div>
      <svg
        viewBox={CHART_VIEWBOX}
        preserveAspectRatio="none"
        className="h-40 w-full"
      >
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          d={data.areaPath}
          className="fill-white/10"
        />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: LINE_EASE }}
          d={data.linePath}
          className="fill-none stroke-white"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.lastPoint !== null ? (
          <motion.circle
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.3 }}
            cx={data.lastPoint.x}
            cy={data.lastPoint.y}
            r={2}
            className="fill-white"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
      <div className="mt-6 flex items-center justify-between text-[11px] opacity-60">
        <span>{formatBRL(data.min)}</span>
        <span>{formatBRL(data.max)}</span>
      </div>
    </div>
  );
}

export default BalanceLineChart;
