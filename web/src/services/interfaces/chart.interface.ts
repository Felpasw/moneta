import type { TransactionType } from "@/services/interfaces/transactions.interface";

export enum ChartType {
  Bar = "bar",
  StackedBar = "stacked-bar",
  Line = "line",
  Area = "area",
  Pie = "pie",
  Donut = "donut",
  Scatter = "scatter",
  Heatmap = "heatmap",
}

export enum XField {
  Date = "date",
  Category = "category",
  Bank = "bank",
  TransactionType = "transactionType",
}

export enum Grouping {
  Day = "day",
  Week = "week",
  Month = "month",
  Quarter = "quarter",
  Year = "year",
  Category = "category",
  Bank = "bank",
  TransactionType = "transactionType",
}

export enum YField {
  Amount = "amount",
  Count = "count",
}

export enum Aggregation {
  Sum = "sum",
  Avg = "avg",
  Min = "min",
  Max = "max",
  Count = "count",
}

export enum DatePreset {
  ThisMonth = "this_month",
  Ytd = "ytd",
  AllTime = "all_time",
}

export enum RollingUnit {
  Day = "day",
  Week = "week",
  Month = "month",
  Quarter = "quarter",
  Year = "year",
}

export enum AggregatedFrom {
  Day = "day",
  Week = "week",
  Month = "month",
}

export type DateRange =
  | { from: string; to: string }
  | { preset: DatePreset }
  | { rolling: { unit: RollingUnit; n: number } };

export interface ChartSpecFilters {
  dateRange?: DateRange;
  transactionTypes?: TransactionType[];
  categoryIds?: string[];
  accountIds?: string[];
  bankIds?: string[];
}

export interface ChartSpec {
  chartType: ChartType;
  xAxis: { field: XField; grouping?: Grouping };
  yAxis: { field: YField; aggregation: Aggregation };
  filters: ChartSpecFilters;
  title: string;
  seriesLabel?: string;
}

export interface ChartDataPoint {
  x: string;
  y: number;
}

export interface ChartDataMeta {
  totalRows: number;
  aggregatedFrom?: AggregatedFrom;
}

export interface ChartData {
  points: ChartDataPoint[];
  meta: ChartDataMeta;
}
