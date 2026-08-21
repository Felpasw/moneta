export interface ChartDataPoint {
  readonly x: string;
  readonly y: number;
}

export type AggregatedFrom = 'day' | 'week' | 'month';

export interface ChartDataMeta {
  readonly totalRows: number;
  readonly aggregatedFrom?: AggregatedFrom;
}

export interface ChartData {
  readonly points: readonly ChartDataPoint[];
  readonly meta: ChartDataMeta;
}
