import { Prisma } from '@prisma/client';

import type { StrategyHandler } from '~/finance/charts/application/types/strategy-handler';
import { buildWhereSql } from '~/finance/charts/application/utils/build-where-sql';

const UNKNOWN_BANK_LABEL = 'Unknown bank';

interface BankBucketRow {
  readonly bankId: string;
  readonly bankName: string | null;
  readonly value: number | null;
}

export const aggregateByBank: StrategyHandler = async ({
  tx,
  where,
  yAxis,
}) => {
  const aggregation =
    yAxis.aggregation === 'count'
      ? Prisma.raw('COUNT(*)::float')
      : Prisma.raw(`${yAxis.aggregation.toUpperCase()}(t.amount)::float`);

  const rows = await tx.$queryRaw<ReadonlyArray<BankBucketRow>>`
    SELECT b.id AS "bankId",
           b.name AS "bankName",
           ${aggregation} AS value
    FROM transactions t
    JOIN user_bank_accounts a ON a.id = t.account_id
    JOIN banks b ON b.id = a.bank_id
    WHERE ${buildWhereSql(where, 't')}
    GROUP BY b.id, b.name
    ORDER BY value DESC NULLS LAST
  `;

  const points = rows.map((row) => ({
    x: row.bankName ?? UNKNOWN_BANK_LABEL,
    y: row.value ?? 0,
  }));

  return { points, meta: { totalRows: points.length } };
};
