"use client";

import { useMemo } from "react";

import { motion } from "motion/react";

import type { DynamicPieChartProps } from "@/components/organisms/interfaces/DynamicChart.interface";
import { formatBRL } from "@/utils/currency";

const RADIUS = 40;
const CENTER = 50;
const DONUT_INNER_RADIUS = 24;
const SLICE_EASE = [0.16, 1, 0.3, 1] as const;
const SLICE_OPACITIES = [1, 0.82, 0.66, 0.52, 0.4, 0.3, 0.22, 0.15];

interface Slice {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly path: string;
  readonly opacity: number;
  readonly percent: number;
}

const polarToCartesian = (angleRad: number, radius: number) => ({
  x: CENTER + radius * Math.cos(angleRad),
  y: CENTER + radius * Math.sin(angleRad),
});

const buildSlicePath = (
  startAngle: number,
  endAngle: number,
  innerRadius: number,
): string => {
  const startOuter = polarToCartesian(startAngle, RADIUS);
  const endOuter = polarToCartesian(endAngle, RADIUS);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  if (innerRadius === 0) {
    return `M${CENTER} ${CENTER} L${startOuter.x} ${startOuter.y} A${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} Z`;
  }
  const startInner = polarToCartesian(endAngle, innerRadius);
  const endInner = polarToCartesian(startAngle, innerRadius);
  return `M${startOuter.x} ${startOuter.y} A${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} L${startInner.x} ${startInner.y} A${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y} Z`;
};

const computeSlices = (
  points: { x: string; y: number }[],
  innerRadius: number,
): Slice[] => {
  const total = points.reduce((acc, p) => acc + Math.max(p.y, 0), 0);
  if (total <= 0) return [];
  let cursor = -Math.PI / 2;
  return points.map((point, idx) => {
    const value = Math.max(point.y, 0);
    const angleSpan = (value / total) * Math.PI * 2;
    const startAngle = cursor;
    const endAngle = cursor + angleSpan;
    cursor = endAngle;
    return {
      key: `${point.x}-${idx}`,
      label: point.x,
      value,
      path: buildSlicePath(startAngle, endAngle, innerRadius),
      opacity: SLICE_OPACITIES[idx % SLICE_OPACITIES.length],
      percent: (value / total) * 100,
    };
  });
};

export function DynamicPieChart({
  points,
  title,
  variant = "pie",
}: DynamicPieChartProps) {
  const innerRadius = variant === "donut" ? DONUT_INNER_RADIUS : 0;
  const slices = useMemo(
    () => computeSlices(points, innerRadius),
    [points, innerRadius],
  );

  return (
    <div className="w-full">
      <h3 className="mb-4 text-sm font-medium opacity-80">{title}</h3>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <svg
          viewBox="0 0 100 100"
          className="h-56 w-56 shrink-0"
          role="img"
          aria-label={title}
        >
          {slices.map((slice, idx) => (
            <motion.path
              key={slice.key}
              d={slice.path}
              className="fill-white"
              fillOpacity={slice.opacity}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05, duration: 0.4, ease: SLICE_EASE }}
              data-testid="slice"
              data-value={slice.value}
            />
          ))}
        </svg>
        <ul className="flex-1 space-y-2 text-xs">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm bg-white"
                style={{ opacity: slice.opacity }}
                aria-hidden
              />
              <span className="flex-1 truncate">{slice.label}</span>
              <span className="opacity-60">
                {formatBRL(slice.value)} ({slice.percent.toFixed(0)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DynamicPieChart;
