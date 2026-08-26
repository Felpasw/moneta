import type { Prisma } from '@prisma/client';

import type { Aggregation } from '~/finance/charts/domain/schemas/chart-spec';

export type GroupByAggregation = Pick<
  Prisma.TransactionGroupByArgs,
  '_sum' | '_avg' | '_min' | '_max' | '_count'
>;

export const GROUP_BY_AGGREGATION_MAP: Record<Aggregation, GroupByAggregation> =
  {
    sum: { _sum: { amount: true } },
    avg: { _avg: { amount: true } },
    min: { _min: { amount: true } },
    max: { _max: { amount: true } },
    count: { _count: { _all: true } },
  };
