import { aggregateByBank } from '~/finance/charts/application/aggregators/aggregate-by-bank';
import { aggregateByCategory } from '~/finance/charts/application/aggregators/aggregate-by-category';
import { aggregateByTime } from '~/finance/charts/application/aggregators/aggregate-by-time';
import { aggregateByTransactionType } from '~/finance/charts/application/aggregators/aggregate-by-transaction-type';
import type { StrategyHandler } from '~/finance/charts/application/types/strategy-handler';
import type { Grouping } from '~/finance/charts/domain/schemas/chart-spec';

export const STRATEGIES: Record<Grouping, StrategyHandler> = {
  day: aggregateByTime,
  week: aggregateByTime,
  month: aggregateByTime,
  quarter: aggregateByTime,
  year: aggregateByTime,
  category: aggregateByCategory,
  bank: aggregateByBank,
  transactionType: aggregateByTransactionType,
};
