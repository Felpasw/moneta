import { Prisma } from '@prisma/client';

import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { PrismaUserBankAccountsRepository } from '~/finance/accounts/infrastructure/repositories/prisma-user-bank-accounts.repository';

interface MockPrisma {
  userBankAccount: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
}

const buildPrisma = (): { prisma: PrismaService; mock: MockPrisma } => {
  const mock: MockPrisma = {
    userBankAccount: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  return { prisma: mock as unknown as PrismaService, mock };
};

const decimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

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
      });
      expect(card.usagePct).toBe(25);
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
});
