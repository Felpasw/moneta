"use client";

import { motion } from "motion/react";

import type { DynamicBarChartProps } from "@/components/organisms/interfaces/DynamicChart.interface";
import { formatBRL } from "@/utils/currency";

const CHART_HEIGHT = 200;
const BAR_GAP = 4;
const BAR_MIN_HEIGHT = 2;
const BAR_EASE = [0.16, 1, 0.3, 1] as const;

export function DynamicBarChart({ points, title }: DynamicBarChartProps) {
  const maxY = points.reduce((acc, p) => (p.y > acc ? p.y : acc), 0);
  const denom = maxY > 0 ? maxY : 1;

  return (
    <div className="w-full">
      <h3 className="mb-4 text-sm font-medium opacity-80">{title}</h3>
      <div
        className="flex items-end justify-between"
        style={{ height: CHART_HEIGHT, gap: BAR_GAP }}
        role="img"
        aria-label={title}
      >
        {points.map((point, idx) => {
          const heightPct = (point.y / denom) * 100;
          return (
            <div
              key={`${point.x}-${idx}`}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <motion.div
                initial={{ height: BAR_MIN_HEIGHT }}
                animate={{ height: `${Math.max(heightPct, 1)}%` }}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.04,
                  ease: BAR_EASE,
                }}
                className="w-full rounded-t-sm bg-white"
                data-testid="bar"
                data-value={point.y}
              />
              <span className="truncate text-[10px] opacity-60">
                {point.x}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] opacity-60">
        <span>{formatBRL(0)}</span>
        <span>{formatBRL(maxY)}</span>
      </div>
    </div>
  );
}

export default DynamicBarChart;
