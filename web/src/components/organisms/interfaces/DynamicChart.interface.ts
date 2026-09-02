import type {
  ChartData,
  ChartSpec,
} from "@/services/interfaces/chart.interface";

export interface DynamicChartProps {
  spec: ChartSpec;
  data: ChartData;
}

export interface DynamicBarChartProps {
  points: ChartData["points"];
  title: string;
  width?: number;
}

export interface DynamicLineChartProps {
  points: ChartData["points"];
  title: string;
  variant?: "line" | "area";
  width?: number;
}

export interface DynamicPieChartProps {
  points: ChartData["points"];
  title: string;
  variant?: "pie" | "donut";
  width?: number;
}
