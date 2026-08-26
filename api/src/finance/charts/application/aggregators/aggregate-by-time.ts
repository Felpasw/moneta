import { Prisma } from '@prisma/client';

import type { StrategyHandler } from '~/finance/charts/application/types/strategy-handler';
import { buildWhereSql } from '~/finance/charts/application/utils/build-where-sql';
import type { TimeBucketRow } from '~/finance/charts/domain/types/time-bucket-row';
import { decideTimeGrouping } from '~/finance/charts/domain/utils/decide-time-grouping';
import {
  formatTimeBucket,
  type TimeGrouping,
} from '~/finance/charts/domain/utils/format-time-bucket';

export const aggregateByTime: StrategyHandler = async ({
  tx,
  where,
  yAxis,
  grouping,
  dateRange,
}) => {
  const decided = decideTimeGrouping(grouping as TimeGrouping, dateRange);

  const aggregation =
    yAxis.aggregation === 'count'
      ? Prisma.raw('COUNT(*)::float')
      : Prisma.raw(`${yAxis.aggregation.toUpperCase()}(amount)::float`);

  const rows = await tx.$queryRaw<ReadonlyArray<TimeBucketRow>>`
    SELECT date_trunc(${decided.effective}, occurred_at) AS bucket,
           ${aggregation} AS value
    FROM transactions
    WHERE ${buildWhereSql(where)}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const points = rows.map((row) => ({
    x: formatTimeBucket(row.bucket, decided.effective),
    y: row.value ?? 0,
  }));

  return {
    points,
    meta: {
      totalRows: points.length,
      aggregatedFrom: decided.aggregatedFrom,
    },
  };
};
