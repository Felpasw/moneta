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
  };
  return { prisma: mock as unknown as PrismaService, mock };
};

const decimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

describe('PrismaCategoriesRepository', () => {
  describe('listForUser', () => {
    it('maps rows with monthlyBudget Decimal to number and preserves null', async () => {
      const { prisma, mock } = buildPrisma();
      mock.category.findMany.mockResolvedValue([
        {
          id: 'g-1',
          userId: null,
          name: 'Alimentação',
          icon: null,
          color: null,
          monthlyBudget: null,
        },
        {
          id: 'c-1',
          userId: 'user-1',
          name: 'Books',
          icon: '📚',
          color: '#22c55e',
          monthlyBudget: decimal(150.5),
        },
      ]);
      const repo = new PrismaCategoriesRepository(prisma);

      const result = await repo.listForUser('user-1');

      expect(result[0].monthlyBudget).toBeNull();
      expect(result[1].monthlyBudget).toBe(150.5);
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
          data: expect.objectContaining({ monthlyBudget: 200 }),
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
          data: expect.objectContaining({ monthlyBudget: null }),
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
