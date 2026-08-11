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
}
