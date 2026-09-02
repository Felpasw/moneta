"use client";

import { useMemo } from "react";

import { arc as d3Arc, pie as d3Pie } from "d3-shape";
import { motion } from "motion/react";

import type { DynamicPieChartProps } from "@/components/organisms/interfaces/DynamicChart.interface";
import { formatBRL } from "@/utils/currency";

const DEFAULT_PIE_SIZE = 224;
const PIE_MARGIN = 4;
const DONUT_INNER_RATIO = 0.48;
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

interface BuildSlicesArgs {
  points: DynamicPieChartProps["points"];
  outerRadius: number;
  innerRadius: number;
}

const buildSlices = ({
  points,
  outerRadius,
  innerRadius,
}: BuildSlicesArgs): Slice[] => {
  const total = points.reduce((acc, p) => acc + Math.max(p.y, 0), 0);
  if (total <= 0) return [];

  const layout = d3Pie<{ y: number }>()
    .value((d) => Math.max(d.y, 0))
    .sort(null)
    .startAngle(0)
    .endAngle(Math.PI * 2);

  const arcGen = d3Arc<{ startAngle: number; endAngle: number }>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  return layout(points).map((wedge, idx) => ({
    key: `${points[idx].x}-${idx}`,
    label: points[idx].x,
    value: wedge.data.y,
    path: arcGen(wedge) ?? "",
    opacity: SLICE_OPACITIES[idx % SLICE_OPACITIES.length],
    percent: (Math.max(wedge.data.y, 0) / total) * 100,
  }));
};

export function DynamicPieChart({
  points,
  title,
  variant = "pie",
  width,
}: DynamicPieChartProps) {
  const size = width ?? DEFAULT_PIE_SIZE;
  const outerRadius = size / 2 - PIE_MARGIN;
  const innerRadius = variant === "donut" ? outerRadius * DONUT_INNER_RATIO : 0;

  const slices = useMemo(
    () => buildSlices({ points, outerRadius, innerRadius }),
    [points, outerRadius, innerRadius],
  );

  return (
    <div className="w-full">
      <h3 className="mb-4 text-sm font-medium opacity-80">{title}</h3>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <svg
          width={size}
          height={size}
          className="shrink-0"
          role="img"
          aria-label={title}
        >
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            {slices.map((slice, idx) => (
              <motion.path
                key={slice.key}
                d={slice.path}
                className="fill-foreground"
                fillOpacity={slice.opacity}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: idx * 0.05,
                  duration: 0.4,
                  ease: SLICE_EASE,
                }}
                data-testid="slice"
                data-value={slice.value}
              />
            ))}
          </g>
        </svg>
        <ul className="flex-1 space-y-2 text-xs">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-center gap-2">
              <span
                className="bg-foreground inline-block h-2.5 w-2.5 rounded-sm"
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
