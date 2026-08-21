import { Injectable } from '@nestjs/common';

import { STRATEGIES } from '~/finance/charts/application/constants/strategies';
import type { ChartSpec } from '~/finance/charts/domain/schemas/chart-spec';
import type { ChartData } from '~/finance/charts/domain/types/chart-data';
import { buildTransactionWhere } from '~/finance/charts/domain/utils/build-transaction-where';
import { resolveDateRange } from '~/finance/charts/domain/utils/resolve-date-range';
import { resolveGrouping } from '~/finance/charts/domain/utils/resolve-grouping';
import { PrismaService } from '~/infrastructure/prisma/prisma.service';

const STATEMENT_TIMEOUT_MS = 5000;

@Injectable()
export class ChartQueryBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(spec: ChartSpec, userId: string, now: Date): Promise<ChartData> {
    const dateRange = spec.filters.dateRange
      ? resolveDateRange(spec.filters.dateRange, now)
      : undefined;

    const where = buildTransactionWhere({
      userId,
      dateRange,
      transactionTypes: spec.filters.transactionTypes,
      categoryIds: spec.filters.categoryIds,
      accountIds: spec.filters.accountIds,
      bankIds: spec.filters.bankIds,
    });

    const grouping = resolveGrouping(spec.xAxis);
    if (grouping === 'bank') {
      throw new Error('bank grouping is not implemented yet');
    }
    const handler = STRATEGIES[grouping];

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`,
      );
      return handler({ tx, where, yAxis: spec.yAxis, grouping });
    });
  }
}
