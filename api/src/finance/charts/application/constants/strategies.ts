import { aggregateByCategory } from '~/finance/charts/application/aggregators/aggregate-by-category';
import { aggregateByTime } from '~/finance/charts/application/aggregators/aggregate-by-time';
import { aggregateByTransactionType } from '~/finance/charts/application/aggregators/aggregate-by-transaction-type';
import type { StrategyHandler } from '~/finance/charts/application/types/strategy-handler';
import type { Grouping } from '~/finance/charts/domain/schemas/chart-spec';

export type SupportedGrouping = Exclude<Grouping, 'bank'>;

export const STRATEGIES: Record<SupportedGrouping, StrategyHandler> = {
  day: aggregateByTime,
  week: aggregateByTime,
  month: aggregateByTime,
  quarter: aggregateByTime,
  year: aggregateByTime,
  category: aggregateByCategory,
  transactionType: aggregateByTransactionType,
};
