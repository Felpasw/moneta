"use client";

import type { ReactNode } from "react";

import { DynamicBarChart } from "@/components/organisms/DynamicBarChart";
import { DynamicLineChart } from "@/components/organisms/DynamicLineChart";
import { DynamicPieChart } from "@/components/organisms/DynamicPieChart";
import type { DynamicChartProps } from "@/components/organisms/interfaces/DynamicChart.interface";
import { ChartType } from "@/services/interfaces/chart.interface";

type Renderer = (props: DynamicChartProps) => ReactNode;

const RENDERERS: Record<ChartType, Renderer> = {
  [ChartType.Bar]: ({ spec, data }) => (
    <DynamicBarChart points={data.points} title={spec.title} />
  ),
  [ChartType.StackedBar]: ({ spec, data }) => (
    <DynamicBarChart points={data.points} title={spec.title} />
  ),
  [ChartType.Line]: ({ spec, data }) => (
    <DynamicLineChart points={data.points} title={spec.title} variant="line" />
  ),
  [ChartType.Area]: ({ spec, data }) => (
    <DynamicLineChart points={data.points} title={spec.title} variant="area" />
  ),
  [ChartType.Pie]: ({ spec, data }) => (
    <DynamicPieChart points={data.points} title={spec.title} variant="pie" />
  ),
  [ChartType.Donut]: ({ spec, data }) => (
    <DynamicPieChart points={data.points} title={spec.title} variant="donut" />
  ),
  [ChartType.Scatter]: ({ spec }) => (
    <UnsupportedChartFallback title={spec.title} />
  ),
  [ChartType.Heatmap]: ({ spec }) => (
    <UnsupportedChartFallback title={spec.title} />
  ),
};

function UnsupportedChartFallback({ title }: { title: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-white/10 p-8 text-center"
    >
      <span className="text-sm opacity-80">{title}</span>
      <span className="text-xs opacity-60">
        this chart type is not supported yet
      </span>
    </div>
  );
}

export function DynamicChart(props: DynamicChartProps) {
  return RENDERERS[props.spec.chartType](props);
}

export default DynamicChart;
