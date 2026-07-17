import { Prisma } from '@prisma/client';

import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { TransactionType } from '~/transactions/domain/constants/transaction-type';
import { TransactionNotFoundError } from '~/transactions/domain/errors/transaction-not-found.error';
import { PrismaTransactionsRepository } from '~/transactions/infrastructure/repositories/prisma-transactions.repository';

interface MockTx {
  transaction: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  userBankAccount: {
    updateMany: jest.Mock;
  };
}

const buildPrisma = (): { prisma: PrismaService; tx: MockTx } => {
  const tx: MockTx = {
    transaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userBankAccount: {
      updateMany: jest.fn(),
    },
  };
  const $transaction = jest.fn((cb: (t: MockTx) => Promise<unknown>) => cb(tx));
  const prisma = { $transaction } as unknown as PrismaService;
  return { prisma, tx };
};

const decimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

const CURRENT_USER = 'user-1';
const ACCOUNT_A = 'acc-a';
const ACCOUNT_B = 'acc-b';
const TRANSACTION_ID = 't-1';

describe('PrismaTransactionsRepository', () => {
  describe('add', () => {
    it('decrements balance by the amount for expenses and creates the transaction', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.transaction.create.mockResolvedValue({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: decimal(100),
        description: null,
        occurredAt: new Date('2026-07-15T12:00:00Z'),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      const result = await repo.add({
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: 100,
        occurredAt: new Date('2026-07-15T12:00:00Z'),
      });

      expect(tx.userBankAccount.updateMany).toHaveBeenCalledWith({
        where: { id: ACCOUNT_A, userId: CURRENT_USER },
        data: { balance: { increment: -100 } },
      });
      expect(result.amount).toBe(100);
    });

    it('increments balance by the amount for incomes', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.transaction.create.mockResolvedValue({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Income,
        amount: decimal(200),
        description: null,
        occurredAt: new Date(),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.add({
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        type: TransactionType.Income,
        amount: 200,
        occurredAt: new Date(),
      });

      expect(tx.userBankAccount.updateMany).toHaveBeenCalledWith({
        where: { id: ACCOUNT_A, userId: CURRENT_USER },
        data: { balance: { increment: 200 } },
      });
    });

    it('throws AccountNotFoundError when the account does not belong to the user', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 0 });
      const repo = new PrismaTransactionsRepository(prisma);

      await expect(
        repo.add({
          userId: CURRENT_USER,
          accountId: 'foreign-account',
          type: TransactionType.Expense,
          amount: 50,
          occurredAt: new Date(),
        }),
      ).rejects.toBeInstanceOf(AccountNotFoundError);

      expect(tx.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('edit', () => {
    it('applies the delta on the same account when amount changes', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue({
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: decimal(40),
      });
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.transaction.update.mockResolvedValue({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: decimal(55),
        description: null,
        occurredAt: new Date(),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.edit({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        amount: 55,
      });

      // old effect: -40; new effect: -55; delta = -15
      expect(tx.userBankAccount.updateMany).toHaveBeenCalledWith({
        where: { id: ACCOUNT_A, userId: CURRENT_USER },
        data: { balance: { increment: -15 } },
      });
    });

    it('does not touch the balance when only description/date change', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue({
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: decimal(40),
      });
      tx.transaction.update.mockResolvedValue({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: decimal(40),
        description: 'Novo',
        occurredAt: new Date(),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.edit({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        description: 'Novo',
      });

      expect(tx.userBankAccount.updateMany).not.toHaveBeenCalled();
    });

    it('moves value between accounts atomically when accountId changes', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue({
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: decimal(30),
      });
      tx.userBankAccount.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });
      tx.transaction.update.mockResolvedValue({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        accountId: ACCOUNT_B,
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: decimal(30),
        description: null,
        occurredAt: new Date(),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.edit({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        accountId: ACCOUNT_B,
      });

      // account A: reverse old effect (-(-30) = +30)
      // account B: apply new effect (-30)
      expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: ACCOUNT_A, userId: CURRENT_USER },
        data: { balance: { increment: 30 } },
      });
      expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: ACCOUNT_B, userId: CURRENT_USER },
        data: { balance: { increment: -30 } },
      });
    });

    it('throws TransactionNotFoundError when the transaction is missing', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue(null);
      const repo = new PrismaTransactionsRepository(prisma);

      await expect(
        repo.edit({ id: 'ghost', userId: CURRENT_USER, amount: 10 }),
      ).rejects.toBeInstanceOf(TransactionNotFoundError);
    });

    it('throws AccountNotFoundError when moving to an unowned account', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue({
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: decimal(30),
      });
      tx.userBankAccount.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      const repo = new PrismaTransactionsRepository(prisma);

      await expect(
        repo.edit({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: 'foreign-account',
        }),
      ).rejects.toBeInstanceOf(AccountNotFoundError);
    });
  });

  describe('delete', () => {
    it('reverses the balance effect and deletes the transaction', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue({
        accountId: ACCOUNT_A,
        type: TransactionType.Income,
        amount: decimal(75),
      });
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.delete(TRANSACTION_ID, CURRENT_USER);

      // income of 75 credited balance; delete reverts: -75
      expect(tx.userBankAccount.updateMany).toHaveBeenCalledWith({
        where: { id: ACCOUNT_A, userId: CURRENT_USER },
        data: { balance: { increment: -75 } },
      });
      expect(tx.transaction.delete).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
      });
    });

    it('throws TransactionNotFoundError when the transaction is missing', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue(null);
      const repo = new PrismaTransactionsRepository(prisma);

      await expect(repo.delete('ghost', CURRENT_USER)).rejects.toBeInstanceOf(
        TransactionNotFoundError,
      );
    });
  });
});
