import { GROUP_BY_AGGREGATION_MAP } from '~/finance/charts/application/constants/group-by-aggregation-map';
import type { StrategyHandler } from '~/finance/charts/application/types/strategy-handler';
import {
  extractYValue,
  type AggregationRow,
} from '~/finance/charts/domain/utils/extract-y-value';

const UNCATEGORIZED_LABEL = 'Uncategorized';

export const aggregateByCategory: StrategyHandler = async ({
  tx,
  where,
  yAxis,
}) => {
  const rows = (await tx.transaction.groupBy({
    by: ['categoryId'],
    where,
    ...GROUP_BY_AGGREGATION_MAP[yAxis.aggregation],
  })) as ReadonlyArray<AggregationRow & { categoryId: string | null }>;

  const categoryIds = rows
    .map((r) => r.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await tx.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  const points = rows.map((row) => ({
    x: row.categoryId
      ? (nameById.get(row.categoryId) ?? UNCATEGORIZED_LABEL)
      : UNCATEGORIZED_LABEL,
    y: extractYValue(row, yAxis.aggregation),
  }));

  return { points, meta: { totalRows: points.length } };
};
