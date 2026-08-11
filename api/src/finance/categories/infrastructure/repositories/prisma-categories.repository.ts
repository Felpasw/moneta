import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { computeUsagePct } from '../../../@shared/utils/compute-usage-pct';
import { decimalToNumber } from '../../../@shared/utils/decimal-to-number';
import { TransactionType } from '../../../transactions/domain/constants/transaction-type';
import type {
  AddCategoryInput,
  CategoriesRepository,
  Category,
  CategoryWithUsage,
  GetTopSpentInMonthInput,
  TopSpentCategory,
  UpdateCategoryInput,
} from '../../domain/ports/categories-repository';

const CATEGORY_SELECT = {
  id: true,
  userId: true,
  name: true,
  icon: true,
  color: true,
  monthlyBudget: true,
} satisfies Prisma.CategorySelect;

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<CategoryWithUsage[]> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [rows, sums] = await Promise.all([
      this.prisma.category.findMany({
        where: { OR: [{ userId: null }, { userId }] },
        orderBy: { name: 'asc' },
        select: CATEGORY_SELECT,
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: TransactionType.Expense,
          occurredAt: { gte: monthStart, lt: monthEnd },
          categoryId: { not: null },
        },
        _sum: { amount: true },
      }),
    ]);

    const spentByCategory = new Map<string, number>();
    for (const s of sums) {
      if (s.categoryId === null) continue;
      spentByCategory.set(s.categoryId, decimalToNumber(s._sum.amount));
    }

    return rows.map((row) => {
      const spent = spentByCategory.get(row.id) ?? 0;
      return {
        ...row,
        spent,
        usagePct: computeUsagePct(spent, row.monthlyBudget),
        overBudget: row.monthlyBudget !== null && spent > row.monthlyBudget,
      };
    });
  }

  async addCustom(input: AddCategoryInput): Promise<Category> {
    return this.prisma.category.create({
      data: {
        userId: input.userId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        monthlyBudget: input.monthlyBudget,
      },
      select: CATEGORY_SELECT,
    });
  }

  async update(input: UpdateCategoryInput): Promise<Category | null> {
    const { count } = await this.prisma.category.updateMany({
      where: { id: input.id, userId: input.userId },
      data: {
        name: input.name,
        icon: input.icon,
        color: input.color,
        monthlyBudget: input.monthlyBudget,
      },
    });
    if (count === 0) return null;
    return this.prisma.category.findUnique({
      where: { id: input.id },
      select: CATEGORY_SELECT,
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.category.deleteMany({
      where: { id, userId },
    });
    return count > 0;
  }

  async getTopSpentInMonth(
    input: GetTopSpentInMonthInput,
  ): Promise<TopSpentCategory[]> {
    return this.prisma.$queryRaw<TopSpentCategory[]>`
      WITH month_total AS (
        SELECT COALESCE(SUM(amount), 0)::float8 AS total
        FROM transactions
        WHERE user_id = ${input.userId}::uuid
          AND type = 'expense'::transaction_type
          AND occurred_at >= ${input.dateFrom}
          AND occurred_at < ${input.dateTo}
      )
      SELECT c.id, c.name, c.icon, c.color,
             SUM(t.amount)::float8 AS spent,
             CASE WHEN (SELECT total FROM month_total) > 0
                  THEN SUM(t.amount)::float8 / (SELECT total FROM month_total)
                  ELSE 0
             END AS share
      FROM transactions t
      INNER JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ${input.userId}::uuid
        AND t.type = 'expense'::transaction_type
        AND t.occurred_at >= ${input.dateFrom}
        AND t.occurred_at < ${input.dateTo}
        AND (c.user_id IS NULL OR c.user_id = ${input.userId}::uuid)
      GROUP BY c.id
      ORDER BY spent DESC
      LIMIT ${input.limit}
    `;
  }
}
