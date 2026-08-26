import { Prisma } from '@prisma/client';

export const buildWhereSql = (
  where: Prisma.TransactionWhereInput,
  alias?: string,
): Prisma.Sql => {
  const prefix = alias ? `${alias}.` : '';
  const userIdCol = Prisma.raw(`${prefix}user_id`);
  const occurredAtCol = Prisma.raw(`${prefix}occurred_at`);

  const clauses: Prisma.Sql[] = [Prisma.sql`${userIdCol} = ${where.userId}`];

  if (
    where.occurredAt &&
    typeof where.occurredAt === 'object' &&
    'gte' in where.occurredAt
  ) {
    const range = where.occurredAt as { gte: Date; lte: Date };
    clauses.push(
      Prisma.sql`${occurredAtCol} >= ${range.gte} AND ${occurredAtCol} <= ${range.lte}`,
    );
  }

  return Prisma.join(clauses, ' AND ');
};
