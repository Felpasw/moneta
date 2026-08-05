import { Prisma } from '@prisma/client';

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
    it('returns accounts owned by the user with the bank nested', async () => {
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
        },
      ]);
      const repo = new PrismaUserBankAccountsRepository(prisma);

      const result = await repo.listByUserId('user-1');

      expect(mock.userBankAccount.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { nickname: 'asc' },
        select: expect.objectContaining({
          bank: {
            select: {
              id: true,
              name: true,
              compeCode: true,
              logoUrl: true,
            },
          },
        }),
      });
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
    });
  });
});
