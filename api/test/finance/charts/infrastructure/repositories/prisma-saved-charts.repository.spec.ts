import type { Prisma } from '@prisma/client';

import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';
import type { ChartSpec } from '~/finance/charts/domain/schemas/chart-spec';
import { PrismaSavedChartsRepository } from '~/finance/charts/infrastructure/repositories/prisma-saved-charts.repository';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';

const firstArg = <T>(mock: jest.Mock): T => {
  const [firstCall] = mock.mock.calls as [[T]];
  return firstCall[0];
};

const USER_ID = '11111111-1111-1111-1111-111111111111';
const CHART_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_USER = '99999999-9999-9999-9999-999999999999';

const spec: ChartSpec = {
  chartType: 'bar',
  xAxis: { field: 'category', grouping: 'category' },
  yAxis: { field: 'amount', aggregation: 'sum' },
  filters: { dateRange: { preset: 'this_month' } },
  title: 'Spending by category',
};

const persistedRow = {
  id: CHART_ID,
  userId: USER_ID,
  name: 'Monthly spending',
  spec,
  pinned: false,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
};

const buildPrisma = () => {
  const savedChart = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  };
  return {
    prisma: { savedChart } as unknown as PrismaService,
    savedChart,
  };
};

describe('PrismaSavedChartsRepository', () => {
  describe('add', () => {
    it('creates a saved chart scoped to the given userId', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.create.mockResolvedValue(persistedRow);
      const repo = new PrismaSavedChartsRepository(prisma);

      const result = await repo.add({
        userId: USER_ID,
        name: 'Monthly spending',
        spec,
      });

      const createCall = firstArg<Prisma.SavedChartCreateArgs>(
        savedChart.create,
      );
      expect(createCall.data).toEqual({
        userId: USER_ID,
        name: 'Monthly spending',
        spec,
      });
      expect(result).toEqual(persistedRow);
    });
  });

  describe('findById', () => {
    it('scopes lookup by userId (never leaks across users)', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.findFirst.mockResolvedValue(persistedRow);
      const repo = new PrismaSavedChartsRepository(prisma);

      await repo.findById({ userId: USER_ID, id: CHART_ID });

      expect(
        firstArg<Prisma.SavedChartFindFirstArgs>(savedChart.findFirst).where,
      ).toEqual({
        id: CHART_ID,
        userId: USER_ID,
      });
    });

    it('returns null when the chart does not belong to the user', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.findFirst.mockResolvedValue(null);
      const repo = new PrismaSavedChartsRepository(prisma);

      const result = await repo.findById({ userId: OTHER_USER, id: CHART_ID });

      expect(result).toBeNull();
    });
  });

  describe('listSummaries', () => {
    it('returns lightweight rows ordered pinned first then most recent', async () => {
      const { prisma, savedChart } = buildPrisma();
      const row = {
        id: 'a',
        name: 'A',
        spec,
        pinned: true,
        updatedAt: new Date('2026-07-01'),
      };
      savedChart.findMany.mockResolvedValue([row]);
      const repo = new PrismaSavedChartsRepository(prisma);

      const result = await repo.listSummaries({ userId: USER_ID });

      const call = firstArg<Prisma.SavedChartFindManyArgs>(savedChart.findMany);
      expect(call.where).toEqual({ userId: USER_ID });
      expect(call.orderBy).toEqual([{ pinned: 'desc' }, { updatedAt: 'desc' }]);
      expect(call.select).toEqual({
        id: true,
        name: true,
        spec: true,
        pinned: true,
        updatedAt: true,
      });
      expect(result[0]).toEqual(row);
    });
  });

  describe('rename', () => {
    it('renames scoped by userId', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.update.mockResolvedValue({ ...persistedRow, name: 'X' });
      savedChart.findFirst.mockResolvedValue(persistedRow);
      const repo = new PrismaSavedChartsRepository(prisma);

      const result = await repo.rename({
        userId: USER_ID,
        id: CHART_ID,
        name: 'X',
      });

      expect(savedChart.findFirst).toHaveBeenCalledWith({
        where: { id: CHART_ID, userId: USER_ID },
      });
      const updateCall = firstArg<Prisma.SavedChartUpdateArgs>(
        savedChart.update,
      );
      expect(updateCall.where).toEqual({ id: CHART_ID });
      expect(updateCall.data).toEqual({ name: 'X' });
      expect(result.name).toBe('X');
    });

    it('throws SavedChartNotFoundError when the chart does not belong to the user', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.findFirst.mockResolvedValue(null);
      const repo = new PrismaSavedChartsRepository(prisma);

      await expect(
        repo.rename({ userId: OTHER_USER, id: CHART_ID, name: 'X' }),
      ).rejects.toBeInstanceOf(SavedChartNotFoundError);
      expect(savedChart.update).not.toHaveBeenCalled();
    });
  });

  describe('togglePin', () => {
    it('flips the pinned flag', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.findFirst.mockResolvedValue(persistedRow);
      savedChart.update.mockResolvedValue({ ...persistedRow, pinned: true });
      const repo = new PrismaSavedChartsRepository(prisma);

      const result = await repo.togglePin({ userId: USER_ID, id: CHART_ID });

      const updateCall = firstArg<Prisma.SavedChartUpdateArgs>(
        savedChart.update,
      );
      expect(updateCall.data).toEqual({ pinned: true });
      expect(result.pinned).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes scoped by userId', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.findFirst.mockResolvedValue(persistedRow);
      savedChart.delete.mockResolvedValue(persistedRow);
      const repo = new PrismaSavedChartsRepository(prisma);

      await repo.delete({ userId: USER_ID, id: CHART_ID });

      expect(savedChart.delete).toHaveBeenCalledWith({
        where: { id: CHART_ID },
      });
    });

    it('throws SavedChartNotFoundError when the chart does not belong to the user', async () => {
      const { prisma, savedChart } = buildPrisma();
      savedChart.findFirst.mockResolvedValue(null);
      const repo = new PrismaSavedChartsRepository(prisma);

      await expect(
        repo.delete({ userId: OTHER_USER, id: CHART_ID }),
      ).rejects.toBeInstanceOf(SavedChartNotFoundError);
      expect(savedChart.delete).not.toHaveBeenCalled();
    });
  });
});
