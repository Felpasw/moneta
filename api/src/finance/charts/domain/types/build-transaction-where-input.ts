import type { ResolvedDateRange } from '~/finance/charts/domain/types/resolved-date-range';
import type { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

export interface BuildTransactionWhereInput {
  readonly userId: string;
  readonly dateRange?: ResolvedDateRange;
  readonly transactionTypes?: readonly TransactionType[];
  readonly categoryIds?: readonly string[];
  readonly accountIds?: readonly string[];
  readonly bankIds?: readonly string[];
}
