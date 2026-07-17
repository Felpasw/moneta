import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  AddCategoryInput,
  CategoriesRepository,
  Category,
  RenameCategoryInput,
} from '../../domain/ports/categories-repository';

const CATEGORY_SELECT = {
  id: true,
  userId: true,
  name: true,
  icon: true,
  color: true,
} satisfies Prisma.CategorySelect;

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: { name: 'asc' },
      select: CATEGORY_SELECT,
    });
  }

  async addCustom(input: AddCategoryInput): Promise<Category> {
    return this.prisma.category.create({
      data: {
        userId: input.userId,
        name: input.name,
        icon: input.icon,
        color: input.color,
      },
      select: CATEGORY_SELECT,
    });
  }

  async rename(input: RenameCategoryInput): Promise<Category | null> {
    const { count } = await this.prisma.category.updateMany({
      where: { id: input.id, userId: input.userId },
      data: { name: input.name },
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
