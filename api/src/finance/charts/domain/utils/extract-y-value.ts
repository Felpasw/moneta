import type { Aggregation } from '~/finance/charts/domain/schemas/chart-spec';

export interface AggregationRow {
  readonly _sum?: { amount: number | null };
  readonly _avg?: { amount: number | null };
  readonly _min?: { amount: number | null };
  readonly _max?: { amount: number | null };
  readonly _count?: { _all: number };
}

const EXTRACTORS: Record<Aggregation, (row: AggregationRow) => number> = {
  sum: (row) => row._sum?.amount ?? 0,
  avg: (row) => row._avg?.amount ?? 0,
  min: (row) => row._min?.amount ?? 0,
  max: (row) => row._max?.amount ?? 0,
  count: (row) => row._count?._all ?? 0,
};

export const extractYValue = (
  row: AggregationRow,
  aggregation: Aggregation,
): number => EXTRACTORS[aggregation](row);
