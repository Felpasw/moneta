import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  AddCategoryInput,
  CategoriesRepository,
  Category,
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

type PrismaCategoryRow = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_SELECT;
}>;

const toDomain = (row: PrismaCategoryRow): Category => ({
  ...row,
  monthlyBudget: row.monthlyBudget?.toNumber() ?? null,
});

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: { name: 'asc' },
      select: CATEGORY_SELECT,
    });
    return rows.map(toDomain);
  }

  async addCustom(input: AddCategoryInput): Promise<Category> {
    const row = await this.prisma.category.create({
      data: {
        userId: input.userId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        monthlyBudget: input.monthlyBudget,
      },
      select: CATEGORY_SELECT,
    });
    return toDomain(row);
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
    const row = await this.prisma.category.findUnique({
      where: { id: input.id },
      select: CATEGORY_SELECT,
    });
    return row ? toDomain(row) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.category.deleteMany({
      where: { id, userId },
    });
    return count > 0;
  }
}
