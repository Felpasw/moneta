"use client";

import { useMemo } from "react";

import { motion } from "motion/react";

import type { DynamicLineChartProps } from "@/components/organisms/interfaces/DynamicChart.interface";
import { formatBRL } from "@/utils/currency";

const CHART_VIEWBOX = "0 0 100 40";
const LINE_EASE = [0.16, 1, 0.3, 1] as const;

interface Geometry {
  linePath: string;
  areaPath: string;
  min: number;
  max: number;
}

const computeGeometry = (points: { x: string; y: number }[]): Geometry => {
  if (points.length === 0) {
    return { linePath: "", areaPath: "", min: 0, max: 0 };
  }
  const values = points.map((p) => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = 40 - ((p.y - min) / range) * 38 - 1;
    return { x, y };
  });
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`)
    .join(" ");
  const areaPath = `${linePath} L100 40 L0 40 Z`;
  return { linePath, areaPath, min, max };
};

export function DynamicLineChart({
  points,
  title,
  variant = "line",
}: DynamicLineChartProps) {
  const geometry = useMemo(() => computeGeometry(points), [points]);

  return (
    <div className="w-full">
      <h3 className="mb-4 text-sm font-medium opacity-80">{title}</h3>
      <svg
        viewBox={CHART_VIEWBOX}
        preserveAspectRatio="none"
        className="h-48 w-full"
        role="img"
        aria-label={title}
      >
        {variant === "area" && geometry.areaPath ? (
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            d={geometry.areaPath}
            className="fill-white/10"
            data-testid="area-fill"
          />
        ) : null}
        {geometry.linePath ? (
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: LINE_EASE }}
            d={geometry.linePath}
            className="fill-none stroke-white"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            data-testid="line-path"
          />
        ) : null}
      </svg>
      <div className="mt-4 flex items-center justify-between text-[11px] opacity-60">
        <span>{formatBRL(geometry.min)}</span>
        <span>{formatBRL(geometry.max)}</span>
      </div>
    </div>
  );
}

export default DynamicLineChart;
