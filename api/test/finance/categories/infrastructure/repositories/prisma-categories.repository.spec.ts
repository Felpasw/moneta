import { Prisma } from '@prisma/client';

import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { PrismaCategoriesRepository } from '~/finance/categories/infrastructure/repositories/prisma-categories.repository';

interface MockPrisma {
  category: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
  };
  transaction: {
    groupBy: jest.Mock;
  };
}

const buildPrisma = (): { prisma: PrismaService; mock: MockPrisma } => {
  const mock: MockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    transaction: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };
  return { prisma: mock as unknown as PrismaService, mock };
};

// Runtime returns number due to Prisma extension (decimal-to-number).
// Kept as identity helper to keep test call-sites readable.
const decimal = (n: number): number => n;

// Prisma's aggregate results are NOT extended — Decimal is still returned.
const aggregateDecimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

describe('PrismaCategoriesRepository', () => {
  describe('listForUser', () => {
    it('enriches categories with spent/usagePct/overBudget from current month expenses', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.findMany.mockResolvedValue([
        {
          id: 'cat-groceries',
          userId: 'user-1',
          name: 'Groceries',
          icon: '🛒',
          color: null,
          monthlyBudget: decimal(500),
        },
        {
          id: 'cat-leisure',
          userId: 'user-1',
          name: 'Leisure',
          icon: '🎮',
          color: null,
          monthlyBudget: decimal(200),
        },
        {
          id: 'g-1',
          userId: null,
          name: 'Salary',
          icon: '💼',
          color: null,
          monthlyBudget: null,
        },
      ]);
      mock.transaction.groupBy.mockResolvedValue([
        {
          categoryId: 'cat-groceries',
          _sum: { amount: aggregateDecimal(250) },
        },
        { categoryId: 'cat-leisure', _sum: { amount: aggregateDecimal(300) } },
      ]);
      const repo = new PrismaCategoriesRepository(prisma);

      const result = await repo.listForUser('user-1');

      const groceries = result.find((c) => c.id === 'cat-groceries');
      expect(groceries).toMatchObject({
        spent: 250,
        usagePct: 50, // 250/500 = 50%
        overBudget: false,
      });

      const leisure = result.find((c) => c.id === 'cat-leisure');
      expect(leisure).toMatchObject({
        spent: 300,
        usagePct: 100, // capped: 300/200 > 1
        overBudget: true,
      });

      const salary = result.find((c) => c.id === 'g-1');
      expect(salary).toMatchObject({
        spent: 0,
        usagePct: 0, // no budget
        overBudget: false,
      });
    });

    it('returns spent=0/usagePct=0/overBudget=false when the category has no expenses this month', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          userId: 'user-1',
          name: 'Books',
          icon: null,
          color: null,
          monthlyBudget: decimal(100),
        },
      ]);
      mock.transaction.groupBy.mockResolvedValue([]);
      const repo = new PrismaCategoriesRepository(prisma);

      const [category] = await repo.listForUser('user-1');

      expect(category.spent).toBe(0);
      expect(category.usagePct).toBe(0);
      expect(category.overBudget).toBe(false);
    });

    it('filters transactions.groupBy by user + expense type + current month bounds', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.findMany.mockResolvedValue([]);
      const repo = new PrismaCategoriesRepository(prisma);

      await repo.listForUser('user-1');

      expect(mock.transaction.groupBy).toHaveBeenCalledTimes(1);
      const [callArgs] = mock.transaction.groupBy.mock.calls as [
        [
          {
            by: string[];
            where: {
              userId: string;
              type: string;
              occurredAt: { gte: Date; lt: Date };
              categoryId: { not: null };
            };
            _sum: { amount: boolean };
          },
        ],
      ];
      const args = callArgs[0];
      expect(args.by).toEqual(['categoryId']);
      expect(args.where.userId).toBe('user-1');
      expect(args.where.type).toBe('expense');
      expect(args._sum.amount).toBe(true);
      // Month bounds: gte = first of current month, lt = first of next month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      expect(args.where.occurredAt.gte).toEqual(monthStart);
      expect(args.where.occurredAt.lt).toEqual(monthEnd);
    });

    it('rounds usagePct to the nearest integer', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          userId: 'user-1',
          name: 'x',
          icon: null,
          color: null,
          monthlyBudget: decimal(300),
        },
      ]);
      mock.transaction.groupBy.mockResolvedValue([
        { categoryId: 'cat-1', _sum: { amount: aggregateDecimal(100) } },
      ]);
      const repo = new PrismaCategoriesRepository(prisma);

      const [category] = await repo.listForUser('user-1');

      // 100 / 300 = 0.333... -> 33
      expect(category.usagePct).toBe(33);
    });
  });

  describe('addCustom', () => {
    it('creates a category with monthlyBudget when provided', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.create.mockResolvedValue({
        id: 'c-1',
        userId: 'user-1',
        name: 'Books',
        icon: null,
        color: null,
        monthlyBudget: decimal(200),
      });
      const repo = new PrismaCategoriesRepository(prisma);

      const result = await repo.addCustom({
        userId: 'user-1',
        name: 'Books',
        monthlyBudget: 200,
      });

      expect(mock.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ monthlyBudget: 200 }) as unknown,
        }),
      );
      expect(result.monthlyBudget).toBe(200);
    });
  });

  describe('update', () => {
    it('updates only the fields provided', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.updateMany.mockResolvedValue({ count: 1 });
      mock.category.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'user-1',
        name: 'Renamed',
        icon: null,
        color: null,
        monthlyBudget: decimal(100),
      });
      const repo = new PrismaCategoriesRepository(prisma);

      const result = await repo.update({
        id: 'c-1',
        userId: 'user-1',
        name: 'Renamed',
      });

      expect(mock.category.updateMany).toHaveBeenCalledWith({
        where: { id: 'c-1', userId: 'user-1' },
        data: {
          name: 'Renamed',
          icon: undefined,
          color: undefined,
          monthlyBudget: undefined,
        },
      });
      expect(result?.name).toBe('Renamed');
      expect(result?.monthlyBudget).toBe(100);
    });

    it('accepts null to clear monthlyBudget explicitly', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.updateMany.mockResolvedValue({ count: 1 });
      mock.category.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'user-1',
        name: 'Books',
        icon: null,
        color: null,
        monthlyBudget: null,
      });
      const repo = new PrismaCategoriesRepository(prisma);

      const result = await repo.update({
        id: 'c-1',
        userId: 'user-1',
        monthlyBudget: null,
      });

      expect(mock.category.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ monthlyBudget: null }) as unknown,
        }),
      );
      expect(result?.monthlyBudget).toBeNull();
    });

    it('returns null when the category is not owned (global or wrong user)', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.updateMany.mockResolvedValue({ count: 0 });
      const repo = new PrismaCategoriesRepository(prisma);

      const result = await repo.update({
        id: 'g-1',
        userId: 'user-1',
        name: 'x',
      });

      expect(result).toBeNull();
      expect(mock.category.findUnique).not.toHaveBeenCalled();
    });
  });
});
