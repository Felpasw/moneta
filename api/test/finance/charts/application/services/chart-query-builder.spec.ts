import type { Prisma } from '@prisma/client';

import type { PrismaService } from '~/infrastructure/prisma/prisma.service';

import { ChartQueryBuilder } from '~/finance/charts/application/services/chart-query-builder';
import type { ChartSpec } from '~/finance/charts/domain/schemas/chart-spec';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const NOW = new Date('2026-08-15T14:30:00.000Z');

interface TxMock {
  $executeRawUnsafe: jest.Mock;
  $queryRaw: jest.Mock;
  transaction: { groupBy: jest.Mock };
  category: { findMany: jest.Mock };
}

const buildPrismaMock = (): { prisma: PrismaService; tx: TxMock } => {
  const tx: TxMock = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn(),
    transaction: { groupBy: jest.fn() },
    category: { findMany: jest.fn() },
  };
  const $transaction = jest.fn((cb: (t: TxMock) => Promise<unknown>) => cb(tx));
  return { prisma: { $transaction } as unknown as PrismaService, tx };
};

const firstGroupByArg = (mock: jest.Mock): Prisma.TransactionGroupByArgs => {
  const [firstCall] = mock.mock.calls as [[Prisma.TransactionGroupByArgs]];
  return firstCall[0];
};

const baseSpec = (overrides: Partial<ChartSpec> = {}): ChartSpec => ({
  chartType: 'bar',
  xAxis: { field: 'category', grouping: 'category' },
  yAxis: { field: 'amount', aggregation: 'sum' },
  filters: { dateRange: { preset: 'this_month' } },
  title: 'Test chart',
  ...overrides,
});

describe('ChartQueryBuilder', () => {
  describe('transaction and timeout', () => {
    it('wraps the query in a prisma transaction and sets statement_timeout to 5s', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.transaction.groupBy.mockResolvedValue([]);
      tx.category.findMany.mockResolvedValue([]);

      const builder = new ChartQueryBuilder(prisma);
      await builder.build(baseSpec(), USER_ID, NOW);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.$executeRawUnsafe).toHaveBeenCalledWith(
        'SET LOCAL statement_timeout = 5000',
      );
    });
  });

  describe('category grouping with sum aggregation', () => {
    it('calls groupBy with categoryId + _sum.amount and includes userId in the where clause', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.transaction.groupBy.mockResolvedValue([
        { categoryId: 'cat-1', _sum: { amount: 1200 } },
        { categoryId: 'cat-2', _sum: { amount: 800 } },
      ]);
      tx.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Food' },
        { id: 'cat-2', name: 'Transport' },
      ]);

      const builder = new ChartQueryBuilder(prisma);
      const result = await builder.build(baseSpec(), USER_ID, NOW);

      const groupByCall = firstGroupByArg(tx.transaction.groupBy);
      expect(groupByCall.by).toEqual(['categoryId']);
      expect(groupByCall._sum).toEqual({ amount: true });
      expect(groupByCall.where.userId).toBe(USER_ID);

      expect(result.points).toEqual([
        { x: 'Food', y: 1200 },
        { x: 'Transport', y: 800 },
      ]);
      expect(result.meta.totalRows).toBe(2);
    });

    it('renders an "Uncategorized" bucket when categoryId is null', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.transaction.groupBy.mockResolvedValue([
        { categoryId: null, _sum: { amount: 300 } },
      ]);
      tx.category.findMany.mockResolvedValue([]);

      const builder = new ChartQueryBuilder(prisma);
      const result = await builder.build(baseSpec(), USER_ID, NOW);

      expect(result.points).toEqual([{ x: 'Uncategorized', y: 300 }]);
    });
  });

  describe('category grouping with count aggregation', () => {
    it('calls groupBy with _count._all and maps count into y', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.transaction.groupBy.mockResolvedValue([
        { categoryId: 'cat-1', _count: { _all: 5 } },
      ]);
      tx.category.findMany.mockResolvedValue([{ id: 'cat-1', name: 'Food' }]);

      const builder = new ChartQueryBuilder(prisma);
      const result = await builder.build(
        baseSpec({ yAxis: { field: 'count', aggregation: 'count' } }),
        USER_ID,
        NOW,
      );

      const groupByCall = firstGroupByArg(tx.transaction.groupBy);
      expect(groupByCall._count).toEqual({ _all: true });
      expect(result.points).toEqual([{ x: 'Food', y: 5 }]);
    });
  });

  describe('transactionType grouping', () => {
    it('groups by type and returns human labels for expense/income', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.transaction.groupBy.mockResolvedValue([
        { type: 'expense', _sum: { amount: 3000 } },
        { type: 'income', _sum: { amount: 5000 } },
      ]);

      const builder = new ChartQueryBuilder(prisma);
      const result = await builder.build(
        baseSpec({
          xAxis: { field: 'transactionType', grouping: 'transactionType' },
        }),
        USER_ID,
        NOW,
      );

      const groupByCall = firstGroupByArg(tx.transaction.groupBy);
      expect(groupByCall.by).toEqual(['type']);
      expect(result.points).toEqual([
        { x: 'Expense', y: 3000 },
        { x: 'Income', y: 5000 },
      ]);
    });
  });

  describe('time grouping (month)', () => {
    it('runs a raw query with date_trunc and maps rows into ISO YYYY-MM buckets', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.$queryRaw.mockResolvedValue([
        { bucket: new Date('2026-06-01T00:00:00.000Z'), value: 1500 },
        { bucket: new Date('2026-07-01T00:00:00.000Z'), value: 2100 },
      ]);

      const builder = new ChartQueryBuilder(prisma);
      const result = await builder.build(
        baseSpec({
          xAxis: { field: 'date', grouping: 'month' },
          filters: {
            dateRange: {
              from: '2026-06-01T00:00:00.000Z',
              to: '2026-07-31T23:59:59.999Z',
            },
          },
        }),
        USER_ID,
        NOW,
      );

      expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result.points).toEqual([
        { x: '2026-06', y: 1500 },
        { x: '2026-07', y: 2100 },
      ]);
      expect(result.meta.aggregatedFrom).toBeUndefined();
    });

    it('escalates day → month when the interval would blow the cap and reports aggregatedFrom', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.$queryRaw.mockResolvedValue([
        { bucket: new Date('2024-01-01T00:00:00.000Z'), value: 100 },
      ]);

      const builder = new ChartQueryBuilder(prisma);
      const result = await builder.build(
        baseSpec({
          xAxis: { field: 'date', grouping: 'day' },
          filters: {
            dateRange: {
              from: '2020-01-01T00:00:00.000Z',
              to: '2026-01-01T00:00:00.000Z',
            },
          },
        }),
        USER_ID,
        NOW,
      );

      expect(result.meta.aggregatedFrom).toBe('day');
      expect(result.meta.totalRows).toBe(1);
    });
  });

  describe('all_time preset (no date filter)', () => {
    it('does not include occurredAt in the where clause', async () => {
      const { prisma, tx } = buildPrismaMock();
      tx.transaction.groupBy.mockResolvedValue([]);
      tx.category.findMany.mockResolvedValue([]);

      const builder = new ChartQueryBuilder(prisma);
      await builder.build(
        baseSpec({ filters: { dateRange: { preset: 'all_time' } } }),
        USER_ID,
        NOW,
      );

      const groupByCall = firstGroupByArg(tx.transaction.groupBy);
      expect(groupByCall.where.occurredAt).toBeUndefined();
      expect(groupByCall.where.userId).toBe(USER_ID);
    });
  });
});
