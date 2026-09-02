"use client";

import { useMemo } from "react";

import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear } from "@visx/scale";
import { motion } from "motion/react";

import type { DynamicBarChartProps } from "@/components/organisms/interfaces/DynamicChart.interface";
import { formatBRL } from "@/utils/currency";

const CHART_HEIGHT = 240;
const LABEL_ROW = 24;
const MARGIN_X = 4;
const BAR_MAX_HEIGHT = CHART_HEIGHT - LABEL_ROW;
const BAR_MIN_HEIGHT = 2;
const BAR_RADIUS = 4;
const BAR_EASE = [0.16, 1, 0.3, 1] as const;

interface CanvasProps {
  points: DynamicBarChartProps["points"];
  width: number;
}

function BarCanvas({ points, width }: CanvasProps) {
  const maxY = useMemo(
    () => points.reduce((acc, p) => (p.y > acc ? p.y : acc), 0),
    [points],
  );

  const xScale = useMemo(
    () =>
      scaleBand<number>({
        domain: points.map((_, idx) => idx),
        range: [MARGIN_X, width - MARGIN_X],
        padding: 0.2,
      }),
    [points, width],
  );

  const heightScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxY > 0 ? maxY : 1],
        range: [0, BAR_MAX_HEIGHT],
        clamp: true,
      }),
    [maxY],
  );

  const bandWidth = xScale.bandwidth();

  return (
    <svg width={width} height={CHART_HEIGHT}>
      {points.map((point, idx) => {
        const height = Math.max(heightScale(point.y), BAR_MIN_HEIGHT);
        return (
          <motion.rect
            key={`${point.x}-${idx}`}
            x={xScale(idx) ?? 0}
            width={bandWidth}
            rx={BAR_RADIUS}
            ry={BAR_RADIUS}
            className="fill-foreground/90"
            initial={{
              y: BAR_MAX_HEIGHT - BAR_MIN_HEIGHT,
              height: BAR_MIN_HEIGHT,
              opacity: 0.4,
            }}
            animate={{ y: BAR_MAX_HEIGHT - height, height, opacity: 1 }}
            transition={{ duration: 0.6, delay: idx * 0.04, ease: BAR_EASE }}
            data-testid="bar"
            data-value={point.y}
          />
        );
      })}
      {points.map((point, idx) => (
        <text
          key={`${point.x}-${idx}-label`}
          x={(xScale(idx) ?? 0) + bandWidth / 2}
          y={CHART_HEIGHT - 6}
          textAnchor="middle"
          className="fill-foreground/60"
          fontSize={10}
        >
          {point.x}
        </text>
      ))}
    </svg>
  );
}

export function DynamicBarChart({ points, title, width }: DynamicBarChartProps) {
  const maxY = points.reduce((acc, p) => (p.y > acc ? p.y : acc), 0);

  return (
    <div className="w-full">
      <h3 className="mb-4 text-sm font-medium opacity-80">{title}</h3>
      <div
        style={{ height: CHART_HEIGHT }}
        role="img"
        aria-label={title}
        className="w-full"
      >
        {width !== undefined ? (
          <BarCanvas points={points} width={width} />
        ) : (
          <ParentSize>
            {({ width: measured }) =>
              measured > 0 ? (
                <BarCanvas points={points} width={measured} />
              ) : null
            }
          </ParentSize>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] opacity-60">
        <span>{formatBRL(0)}</span>
        <span>{formatBRL(maxY)}</span>
      </div>
    </div>
  );
}

export default DynamicBarChart;
