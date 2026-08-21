import { Prisma } from '@prisma/client';

export const buildWhereSql = (
  where: Prisma.TransactionWhereInput,
): Prisma.Sql => {
  const clauses: Prisma.Sql[] = [Prisma.sql`user_id = ${where.userId}`];

  if (
    where.occurredAt &&
    typeof where.occurredAt === 'object' &&
    'gte' in where.occurredAt
  ) {
    const range = where.occurredAt as { gte: Date; lte: Date };
    clauses.push(
      Prisma.sql`occurred_at >= ${range.gte} AND occurred_at <= ${range.lte}`,
    );
  }

  return Prisma.join(clauses, ' AND ');
};
