import { GROUP_BY_AGGREGATION_MAP } from '~/finance/charts/application/constants/group-by-aggregation-map';
import type { StrategyHandler } from '~/finance/charts/application/types/strategy-handler';
import { TRANSACTION_TYPE_LABELS } from '~/finance/charts/domain/constants/transaction-type-labels';
import {
  extractYValue,
  type AggregationRow,
} from '~/finance/charts/domain/utils/extract-y-value';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

export const aggregateByTransactionType: StrategyHandler = async ({
  tx,
  where,
  yAxis,
}) => {
  const rows = (await tx.transaction.groupBy({
    by: ['type'],
    where,
    ...GROUP_BY_AGGREGATION_MAP[yAxis.aggregation],
  })) as ReadonlyArray<AggregationRow & { type: TransactionType }>;

  const points = rows.map((row) => ({
    x: TRANSACTION_TYPE_LABELS[row.type],
    y: extractYValue(row, yAxis.aggregation),
  }));

  return { points, meta: { totalRows: points.length } };
};
