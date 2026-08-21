import type { Prisma } from '@prisma/client';

import type { BuildTransactionWhereInput } from '~/finance/charts/domain/types/build-transaction-where-input';

export const buildTransactionWhere = (
  input: BuildTransactionWhereInput,
): Prisma.TransactionWhereInput => ({
  userId: input.userId,
  occurredAt: input.dateRange && {
    gte: input.dateRange.from,
    lte: input.dateRange.to,
  },
  type: input.transactionTypes && { in: [...input.transactionTypes] },
  categoryId: input.categoryIds && { in: [...input.categoryIds] },
  accountId: input.accountIds && { in: [...input.accountIds] },
  account: input.bankIds && { bankId: { in: [...input.bankIds] } },
});
