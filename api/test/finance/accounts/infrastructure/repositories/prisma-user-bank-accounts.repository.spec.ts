import { Prisma } from '@prisma/client';

import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { PrismaUserBankAccountsRepository } from '~/finance/accounts/infrastructure/repositories/prisma-user-bank-accounts.repository';

interface MockPrisma {
  userBankAccount: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    aggregate: jest.Mock;
  };
}

const buildPrisma = (): { prisma: PrismaService; mock: MockPrisma } => {
  const mock: MockPrisma = {
    userBankAccount: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
  };
  return { prisma: mock as unknown as PrismaService, mock };
};

// Runtime returns number due to Prisma extension (decimal-to-number).
// Kept as identity helper to keep test call-sites readable.
const decimal = (n: number): number => n;

// Prisma's aggregate results are NOT extended — Decimal is still returned.
const aggregateDecimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

describe('PrismaUserBankAccountsRepository', () => {
  describe('listByUserId', () => {
    it('returns checking accounts with currentInvoice=null and usagePct=0', async () => {
      const { prisma, mock } = buildPrisma();
      mock.userBankAccount.findMany.mockResolvedValue([
        {
          id: 'acc-1',
          userId: 'user-1',
          bankId: 'bank-1',
          nickname: 'Main',
          balance: decimal(120.5),
          creditLimit: null,
          overdraftLimit: decimal(500),
          closeDay: null,
          dueDay: null,
          bank: {
            id: 'bank-1',
            name: 'Nubank',
            compeCode: '260',
            logoUrl: null,
          },
          invoices: [],
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const result = await repo.listByUserId('user-1');

      const [firstCallArgs] = mock.userBankAccount.findMany.mock.calls as [
        [
          {
            where: unknown;
            orderBy: unknown;
            select: {
              bank: unknown;
              invoices: { where: unknown; take: number };
            };
          },
        ],
      ];
      const findManyArgs = firstCallArgs[0];
      expect(findManyArgs.where).toEqual({ userId: 'user-1' });
      expect(findManyArgs.orderBy).toEqual({ nickname: 'asc' });
      expect(findManyArgs.select.bank).toEqual({
        select: {
          id: true,
          name: true,
          compeCode: true,
          logoUrl: true,
        },
      });
      expect(findManyArgs.select.invoices.where).toEqual({ status: 'open' });
      expect(findManyArgs.select.invoices.take).toBe(1);
      expect(result).toEqual([
        {
          id: 'acc-1',
          userId: 'user-1',
          bankId: 'bank-1',
          nickname: 'Main',
          balance: 120.5,
          creditLimit: null,
          overdraftLimit: 500,
          closeDay: null,
          dueDay: null,
          bank: {
            id: 'bank-1',
            name: 'Nubank',
            compeCode: '260',
            logoUrl: null,
          },
          currentInvoice: null,
          usagePct: 0,
        },
      ]);
    });

    it('preserves the credit-card bank fields when nested (logoUrl present)', async () => {
      const { prisma, mock } = buildPrisma();
      mock.userBankAccount.findMany.mockResolvedValue([
        {
          id: 'acc-card',
          userId: 'user-1',
          bankId: 'bank-c6',
          nickname: 'C6 Carbon',
          balance: decimal(0),
          creditLimit: decimal(8000),
          overdraftLimit: null,
          closeDay: 5,
          dueDay: 12,
          bank: {
            id: 'bank-c6',
            name: 'Banco C6',
            compeCode: '336',
            logoUrl: 'https://cdn/c6.svg',
          },
          invoices: [],
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const [card] = await repo.listByUserId('user-1');

      expect(card.creditLimit).toBe(8000);
      expect(card.bank).toEqual({
        id: 'bank-c6',
        name: 'Banco C6',
        compeCode: '336',
        logoUrl: 'https://cdn/c6.svg',
      });
      expect(card.currentInvoice).toBeNull();
      expect(card.usagePct).toBe(0);
    });

    it('embeds currentInvoice + computes usagePct when a credit account has an open invoice', async () => {
      const { prisma, mock } = buildPrisma();
      const cycleStart = new Date('2026-08-05');
      const cycleEnd = new Date('2026-09-04');
      const dueDate = new Date('2026-09-12');
      mock.userBankAccount.findMany.mockResolvedValue([
        {
          id: 'acc-nu',
          userId: 'user-1',
          bankId: 'bank-nu',
          nickname: 'Ultravioleta',
          balance: decimal(0),
          creditLimit: decimal(10000),
          overdraftLimit: null,
          closeDay: 5,
          dueDay: 12,
          bank: {
            id: 'bank-nu',
            name: 'Nubank',
            compeCode: '260',
            logoUrl: null,
          },
          invoices: [
            {
              totalAmount: decimal(2500),
              status: 'open',
              dueDate,
              cycleStart,
              cycleEnd,
            },
          ],
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const [card] = await repo.listByUserId('user-1');

      expect(card.currentInvoice).toEqual({
        totalAmount: 2500,
        status: InvoiceStatus.Open,
        dueDate,
        cycleStart,
        cycleEnd,
        available: 7500,
      });
      expect(card.usagePct).toBe(25);
    });

    it('caps available at 0 when totalAmount exceeds creditLimit', async () => {
      const { prisma, mock } = buildPrisma();
      mock.userBankAccount.findMany.mockResolvedValue([
        {
          id: 'acc-nu',
          userId: 'user-1',
          bankId: 'bank-nu',
          nickname: 'Overspent',
          balance: decimal(0),
          creditLimit: decimal(1000),
          overdraftLimit: null,
          closeDay: 5,
          dueDay: 12,
          bank: {
            id: 'bank-nu',
            name: 'Nubank',
            compeCode: '260',
            logoUrl: null,
          },
          invoices: [
            {
              totalAmount: decimal(1500),
              status: 'open',
              dueDate: new Date('2026-09-12'),
              cycleStart: new Date('2026-08-05'),
              cycleEnd: new Date('2026-09-04'),
            },
          ],
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const [card] = await repo.listByUserId('user-1');

      expect(card.currentInvoice?.available).toBe(0);
    });

    it('caps usagePct at 100 when totalAmount exceeds creditLimit', async () => {
      const { prisma, mock } = buildPrisma();
      mock.userBankAccount.findMany.mockResolvedValue([
        {
          id: 'acc-nu',
          userId: 'user-1',
          bankId: 'bank-nu',
          nickname: 'Overspent',
          balance: decimal(0),
          creditLimit: decimal(1000),
          overdraftLimit: null,
          closeDay: 5,
          dueDay: 12,
          bank: {
            id: 'bank-nu',
            name: 'Nubank',
            compeCode: '260',
            logoUrl: null,
          },
          invoices: [
            {
              totalAmount: decimal(1500),
              status: 'open',
              dueDate: new Date('2026-09-12'),
              cycleStart: new Date('2026-08-05'),
              cycleEnd: new Date('2026-09-04'),
            },
          ],
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const [card] = await repo.listByUserId('user-1');

      expect(card.usagePct).toBe(100);
    });

    it('rounds usagePct to the nearest integer', async () => {
      const { prisma, mock } = buildPrisma();
      mock.userBankAccount.findMany.mockResolvedValue([
        {
          id: 'acc-1',
          userId: 'user-1',
          bankId: 'bank-1',
          nickname: 'Rounded',
          balance: decimal(0),
          creditLimit: decimal(300),
          overdraftLimit: null,
          closeDay: 5,
          dueDay: 12,
          bank: {
            id: 'bank-1',
            name: 'Nubank',
            compeCode: '260',
            logoUrl: null,
          },
          invoices: [
            {
              totalAmount: decimal(100),
              status: 'open',
              dueDate: new Date('2026-09-12'),
              cycleStart: new Date('2026-08-05'),
              cycleEnd: new Date('2026-09-04'),
            },
          ],
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const [card] = await repo.listByUserId('user-1');

      // 100 / 300 = 0.333... -> 33
      expect(card.usagePct).toBe(33);
    });
  });

  describe('summarizeCheckings', () => {
    it('returns Postgres-aggregated totals across checking accounts only', async () => {
      const { prisma, mock } = buildPrisma();
      mock.userBankAccount.aggregate.mockResolvedValue({
        _sum: {
          balance: aggregateDecimal(1234.56),
          overdraftLimit: aggregateDecimal(1500),
        },
        _count: { _all: 3 },
      });
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const summary = await repo.summarizeCheckings('user-1');

      expect(summary).toEqual({
        totalBalance: 1234.56,
        checkingCount: 3,
        totalOverdraft: 1500,
      });
      expect(mock.userBankAccount.aggregate).toHaveBeenCalledWith({
        where: { userId: 'user-1', creditLimit: null },
        _sum: { balance: true, overdraftLimit: true },
        _count: { _all: true },
      });
    });

    it('returns zeros when the user has no checking accounts', async () => {
      const { prisma, mock } = buildPrisma();
      mock.userBankAccount.aggregate.mockResolvedValue({
        _sum: { balance: null, overdraftLimit: null },
        _count: { _all: 0 },
      });
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const summary = await repo.summarizeCheckings('user-1');

      expect(summary).toEqual({
        totalBalance: 0,
        checkingCount: 0,
        totalOverdraft: 0,
      });
    });
  });

  describe('getBalanceChart', () => {
    const buildQueryRawPrisma = () => {
      const $queryRaw = jest.fn();
      const prisma = { $queryRaw } as unknown as PrismaService;
      return { prisma, $queryRaw };
    };

    it('unwraps the json_build_object result and returns SVG paths + lastPoint precomputed by SQL', async () => {
      const { prisma, $queryRaw } = buildQueryRawPrisma();
      const result = {
        points: [
          { date: '2026-07-17', balance: '4000.00' },
          { date: '2026-07-18', balance: '3900.55' },
        ],
        min: '3900.55',
        max: '4000.00',
        linePath: 'M 0 0 L 100 40',
        areaPath: 'M 0 0 L 100 40 L 100 40 L 0 40 Z',
        lastPoint: { x: 100, y: 40 },
      };
      $queryRaw.mockResolvedValue([{ result }]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const chart = await repo.getBalanceChart({
        userId: 'user-1',
        now: new Date('2026-08-15T12:00:00Z'),
        days: 30,
      });

      expect(chart).toBe(result);
      expect($queryRaw).toHaveBeenCalledTimes(1);
    });

    it('emits SQL that precomputes SVG paths via string_agg, no float8', async () => {
      const { prisma, $queryRaw } = buildQueryRawPrisma();
      $queryRaw.mockResolvedValue([
        {
          result: {
            points: [],
            min: '0.00',
            max: '0.00',
            linePath: '',
            areaPath: '',
            lastPoint: null,
          },
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);
      const now = new Date('2026-08-15T12:00:00Z');

      await repo.getBalanceChart({
        userId: 'user-1',
        now,
        days: 30,
      });

      const call = $queryRaw.mock.calls[0] as [string[], ...unknown[]];
      expect(call.slice(1)).toEqual([now, 30, 'user-1', now, 30, 'user-1']);
      const fullSql = call[0].join('$');
      expect(fullSql).toContain('generate_series');
      expect(fullSql).toContain('credit_limit IS NULL');
      expect(fullSql).toContain('CASE WHEN');
      expect(fullSql).toMatch(/OVER \(\s*ORDER BY/);
      expect(fullSql).toContain('json_build_object');
      expect(fullSql).toContain('json_agg');
      expect(fullSql).toContain('balance::text');
      expect(fullSql).toContain('MIN(');
      expect(fullSql).toContain('MAX(');
      expect(fullSql).toContain('OVER ()');
      expect(fullSql).toContain('ROW_NUMBER()');
      expect(fullSql).toContain('string_agg');
      expect(fullSql).toContain("'linePath'");
      expect(fullSql).toContain("'areaPath'");
      expect(fullSql).toContain("'lastPoint'");
      expect(fullSql).toContain('ROUND(');
      expect(fullSql).not.toContain('::float8');
    });

    it('returns empty points + zero min/max + empty paths when SQL yields no rows', async () => {
      const { prisma, $queryRaw } = buildQueryRawPrisma();
      $queryRaw.mockResolvedValue([
        {
          result: {
            points: [],
            min: '0.00',
            max: '0.00',
            linePath: '',
            areaPath: '',
            lastPoint: null,
          },
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const chart = await repo.getBalanceChart({
        userId: 'user-1',
        now: new Date('2026-08-15T12:00:00Z'),
        days: 30,
      });

      expect(chart).toEqual({
        points: [],
        min: '0.00',
        max: '0.00',
        linePath: '',
        areaPath: '',
        lastPoint: null,
      });
    });
  });
});
