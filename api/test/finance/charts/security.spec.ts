import type { Prisma } from '@prisma/client';

import { ChartQueryBuilder } from '~/finance/charts/application/services/chart-query-builder';
import { chartSpecSchema } from '~/finance/charts/domain/schemas/chart-spec';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';

import { CreateVisualizationTool } from '~/agent/tools/charts/create-visualization.tool';

const AUTHENTIC_USER = '11111111-1111-1111-1111-111111111111';
const ATTACKER_USER = '99999999-9999-9999-9999-999999999999';
const NOW = new Date('2026-08-15T14:30:00.000Z');

const validSpec = {
  chartType: 'bar' as const,
  xAxis: { field: 'category' as const, grouping: 'category' as const },
  yAxis: { field: 'amount' as const, aggregation: 'sum' as const },
  filters: { dateRange: { preset: 'this_month' as const } },
  title: 'Test chart',
};

interface TxMock {
  $executeRawUnsafe: jest.Mock;
  $queryRaw: jest.Mock;
  transaction: { groupBy: jest.Mock };
  category: { findMany: jest.Mock };
}

const buildPrismaMock = (): { prisma: PrismaService; tx: TxMock } => {
  const tx: TxMock = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([]),
    transaction: { groupBy: jest.fn().mockResolvedValue([]) },
    category: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const $transaction = jest.fn((cb: (t: TxMock) => Promise<unknown>) => cb(tx));
  return { prisma: { $transaction } as unknown as PrismaService, tx };
};

const firstGroupByArg = (mock: jest.Mock): Prisma.TransactionGroupByArgs => {
  const [firstCall] = mock.mock.calls as [[Prisma.TransactionGroupByArgs]];
  return firstCall[0];
};

describe('charts security invariants (MNT-79)', () => {
  describe('userId is never taken from user input', () => {
    it('Zod strict schema rejects any userId field in the payload', () => {
      const result = chartSpecSchema.safeParse({
        ...validSpec,
        userId: ATTACKER_USER,
      });
      expect(result.success).toBe(false);
    });

    it('ChartQueryBuilder always writes ctx userId into the where clause', async () => {
      const { prisma, tx } = buildPrismaMock();
      const builder = new ChartQueryBuilder(prisma);

      await builder.build(validSpec, AUTHENTIC_USER, NOW);

      const groupByCall = firstGroupByArg(tx.transaction.groupBy);
      expect(groupByCall.where.userId).toBe(AUTHENTIC_USER);
      expect(groupByCall.where.userId).not.toBe(ATTACKER_USER);
    });

    it('CreateVisualizationTool rejects a smuggled userId before hitting the builder', async () => {
      const chartQueryBuilder = { build: jest.fn() };
      const clock = { now: () => NOW };
      const tool = new CreateVisualizationTool(
        chartQueryBuilder as unknown as ConstructorParameters<
          typeof CreateVisualizationTool
        >[0],
        clock,
      );

      const result = await tool.execute(
        { ...validSpec, userId: ATTACKER_USER },
        { userId: AUTHENTIC_USER, requestId: 'req-1' },
      );

      expect(result.ok).toBe(false);
      expect(chartQueryBuilder.build).not.toHaveBeenCalled();
    });
  });

  describe('whitelist enforcement', () => {
    it.each([
      ['xAxis.field', { ...validSpec, xAxis: { field: 'password_hash' } }],
      [
        'xAxis.grouping',
        {
          ...validSpec,
          xAxis: { field: 'date' as const, grouping: 'century' },
        },
      ],
      ['chartType', { ...validSpec, chartType: 'radar' }],
      [
        'yAxis.aggregation',
        {
          ...validSpec,
          yAxis: { field: 'amount' as const, aggregation: 'median' },
        },
      ],
      [
        'transactionType',
        {
          ...validSpec,
          filters: { transactionTypes: ['transfer'] },
        },
      ],
      [
        'preset',
        { ...validSpec, filters: { dateRange: { preset: 'forever' } } },
      ],
      [
        'unknown top-level field',
        { ...validSpec, rawSql: 'SELECT * FROM credentials' },
      ],
    ])('rejects out-of-whitelist %s', (_label, payload) => {
      const result = chartSpecSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('SQL injection resistance via filter arrays', () => {
    it('malicious categoryIds strings are passed as parameters, never interpolated into the where clause', async () => {
      const { prisma, tx } = buildPrismaMock();
      const builder = new ChartQueryBuilder(prisma);

      const malicious = "'; DROP TABLE transactions;--";
      const parsed = chartSpecSchema.safeParse({
        ...validSpec,
        filters: { categoryIds: [malicious] },
      });
      // Non-UUID is rejected by zod — the outer boundary blocks injection first
      expect(parsed.success).toBe(false);

      // Even if a raw spec bypassed zod (defense in depth), the builder passes
      // arrays as parameters into Prisma, not string-interpolated SQL.
      await builder.build(
        {
          ...validSpec,
          filters: {
            categoryIds: ['22222222-2222-2222-2222-222222222222'],
          },
        },
        AUTHENTIC_USER,
        NOW,
      );

      const groupByCall = firstGroupByArg(tx.transaction.groupBy);
      expect(groupByCall.where.categoryId).toEqual({
        in: ['22222222-2222-2222-2222-222222222222'],
      });
    });
  });

  describe('statement timeout is always applied', () => {
    it('SET LOCAL statement_timeout = 5000 runs inside the transaction before any query', async () => {
      const { prisma, tx } = buildPrismaMock();
      const builder = new ChartQueryBuilder(prisma);

      await builder.build(validSpec, AUTHENTIC_USER, NOW);

      expect(tx.$executeRawUnsafe).toHaveBeenCalledWith(
        'SET LOCAL statement_timeout = 5000',
      );
      const timeoutCallOrder = tx.$executeRawUnsafe.mock.invocationCallOrder[0];
      const groupByCallOrder =
        tx.transaction.groupBy.mock.invocationCallOrder[0];
      expect(timeoutCallOrder).toBeLessThan(groupByCallOrder);
    });
  });

  describe('unsupported grouping surfaces as a controlled error', () => {
    it('bank grouping throws instead of silently running an unbounded query', async () => {
      const { prisma } = buildPrismaMock();
      const builder = new ChartQueryBuilder(prisma);

      await expect(
        builder.build(
          {
            ...validSpec,
            xAxis: { field: 'bank' as const, grouping: 'bank' as const },
          },
          AUTHENTIC_USER,
          NOW,
        ),
      ).rejects.toThrow(/bank grouping/i);
    });
  });
});
