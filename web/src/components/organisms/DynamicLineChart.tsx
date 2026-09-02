"use client";

import { useMemo } from "react";

import { curveMonotoneX } from "@visx/curve";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { area as d3Area, line as d3Line } from "d3-shape";
import { motion } from "motion/react";

import type { DynamicLineChartProps } from "@/components/organisms/interfaces/DynamicChart.interface";
import { formatBRL } from "@/utils/currency";

const CHART_HEIGHT = 192;
const PADDING_X = 8;
const PADDING_Y = 8;
const LINE_EASE = [0.16, 1, 0.3, 1] as const;
const SINGLE_POINT_RADIUS = 5;
const STROKE_WIDTH = 1.5;

interface CanvasProps {
  points: DynamicLineChartProps["points"];
  width: number;
  variant: "line" | "area";
}

interface Geometry {
  linePath: string;
  areaPath: string;
  xScale: (i: number) => number;
  yScale: (y: number) => number;
  min: number;
  max: number;
}

const buildGeometry = (
  points: DynamicLineChartProps["points"],
  width: number,
): Geometry => {
  const values = points.map((p) => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domainMax = max === min ? max + 1 : max;

  const xScale = scaleLinear<number>({
    domain: [0, Math.max(points.length - 1, 1)],
    range: [PADDING_X, width - PADDING_X],
  });
  const yScale = scaleLinear<number>({
    domain: [min, domainMax],
    range: [CHART_HEIGHT - PADDING_Y, PADDING_Y],
  });

  const linePath =
    d3Line<{ y: number }>()
      .x((_, i) => xScale(i))
      .y((p) => yScale(p.y))
      .curve(curveMonotoneX)(points) ?? "";

  const areaPath =
    d3Area<{ y: number }>()
      .x((_, i) => xScale(i))
      .y0(CHART_HEIGHT - PADDING_Y)
      .y1((p) => yScale(p.y))
      .curve(curveMonotoneX)(points) ?? "";

  return { linePath, areaPath, xScale, yScale, min, max };
};

function LineCanvas({ points, width, variant }: CanvasProps) {
  const geometry = useMemo(
    () => (points.length === 0 ? null : buildGeometry(points, width)),
    [points, width],
  );

  if (!geometry) return <svg width={width} height={CHART_HEIGHT} />;

  if (points.length === 1) {
    return (
      <svg width={width} height={CHART_HEIGHT}>
        <motion.circle
          cx={geometry.xScale(0)}
          cy={geometry.yScale(points[0].y)}
          r={SINGLE_POINT_RADIUS}
          className="fill-foreground"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: LINE_EASE }}
          data-testid="line-path"
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={CHART_HEIGHT}>
      {variant === "area" ? (
        <motion.path
          d={geometry.areaPath}
          className="fill-foreground/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          data-testid="area-fill"
        />
      ) : null}
      <motion.path
        d={geometry.linePath}
        className="stroke-foreground fill-none"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: LINE_EASE }}
        data-testid="line-path"
      />
    </svg>
  );
}

export function DynamicLineChart({
  points,
  title,
  variant = "line",
  width,
}: DynamicLineChartProps) {
  const { min, max } = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 0 };
    const values = points.map((p) => p.y);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [points]);

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
          <LineCanvas points={points} width={width} variant={variant} />
        ) : (
          <ParentSize>
            {({ width: measured }) =>
              measured > 0 ? (
                <LineCanvas
                  points={points}
                  width={measured}
                  variant={variant}
                />
              ) : null
            }
          </ParentSize>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] opacity-60">
        <span>{formatBRL(min)}</span>
        <span>{formatBRL(max)}</span>
      </div>
    </div>
  );
}

export default DynamicLineChart;
