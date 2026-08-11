import { Prisma } from '@prisma/client';

import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { TransactionNotFoundError } from '~/finance/transactions/domain/errors/transaction-not-found.error';
import { PrismaTransactionsRepository } from '~/finance/transactions/infrastructure/repositories/prisma-transactions.repository';

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
  creditCardInvoice: {
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
    creditCardInvoice: {
      updateMany: jest.fn(),
    },
  };
  const $transaction = jest.fn((cb: (t: MockTx) => Promise<unknown>) => cb(tx));
  const prisma = { $transaction } as unknown as PrismaService;
  return { prisma, tx };
};

const decimal = (n: number): number => n;

const aggregateDecimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

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

    it('sets invoice_id and increments invoice.total_amount when invoiceId is provided (card expense)', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
      tx.transaction.create.mockResolvedValue({
        id: TRANSACTION_ID,
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        categoryId: null,
        invoiceId: 'inv-1',
        type: TransactionType.Expense,
        amount: decimal(100),
        description: null,
        occurredAt: new Date(),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.add({
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: 100,
        occurredAt: new Date(),
        invoiceId: 'inv-1',
      });

      const [createArg] = tx.transaction.create.mock.calls[0] as unknown as [
        { data: Record<string, unknown> },
      ];
      expect(createArg.data.invoiceId).toBe('inv-1');
      // expense of 100 → invoice.total_amount increments by +100 (what user owes)
      expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { totalAmount: { increment: 100 } },
      });
    });

    it('does not touch invoices when invoiceId is absent (debit expense)', async () => {
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
        occurredAt: new Date(),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.add({
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: 100,
        occurredAt: new Date(),
      });

      expect(tx.creditCardInvoice.updateMany).not.toHaveBeenCalled();
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

    describe('with invoice reconciliation', () => {
      it('applies invoice delta on the same invoice when card + same cycle', async () => {
        const { prisma, tx } = buildPrisma();
        tx.transaction.findFirst.mockResolvedValue({
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: decimal(40),
          invoiceId: 'inv-1',
        });
        tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
        tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
        tx.transaction.update.mockResolvedValue({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          categoryId: null,
          invoiceId: 'inv-1',
          type: TransactionType.Expense,
          amount: decimal(60),
          description: null,
          occurredAt: new Date(),
        });
        const repo = new PrismaTransactionsRepository(prisma);

        await repo.edit({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          amount: 60,
          newInvoiceId: 'inv-1',
        });

        // invoice: was +40, now +60 → delta +20 (oldEffect=-40, newEffect=-60, oldEffect-newEffect=20)
        expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledWith({
          where: { id: 'inv-1' },
          data: { totalAmount: { increment: 20 } },
        });
      });

      it('reverts old invoice + applies new when invoice changes (cycle jump)', async () => {
        const { prisma, tx } = buildPrisma();
        tx.transaction.findFirst.mockResolvedValue({
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: decimal(50),
          invoiceId: 'inv-old',
        });
        tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
        tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
        tx.transaction.update.mockResolvedValue({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          categoryId: null,
          invoiceId: 'inv-new',
          type: TransactionType.Expense,
          amount: decimal(50),
          description: null,
          occurredAt: new Date(),
        });
        const repo = new PrismaTransactionsRepository(prisma);

        await repo.edit({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          occurredAt: new Date('2026-08-15T00:00:00Z'),
          newInvoiceId: 'inv-new',
        });

        // revert on old (+oldEffect = -50)
        expect(tx.creditCardInvoice.updateMany).toHaveBeenNthCalledWith(1, {
          where: { id: 'inv-old' },
          data: { totalAmount: { increment: -50 } },
        });
        // apply on new (-newEffect = +50)
        expect(tx.creditCardInvoice.updateMany).toHaveBeenNthCalledWith(2, {
          where: { id: 'inv-new' },
          data: { totalAmount: { increment: 50 } },
        });
      });

      it('reverts old invoice only when moving card→debit (newInvoiceId=null)', async () => {
        const { prisma, tx } = buildPrisma();
        tx.transaction.findFirst.mockResolvedValue({
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: decimal(80),
          invoiceId: 'inv-old',
        });
        tx.userBankAccount.updateMany
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 });
        tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
        tx.transaction.update.mockResolvedValue({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: ACCOUNT_B,
          categoryId: null,
          invoiceId: null,
          type: TransactionType.Expense,
          amount: decimal(80),
          description: null,
          occurredAt: new Date(),
        });
        const repo = new PrismaTransactionsRepository(prisma);

        await repo.edit({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: ACCOUNT_B,
          newInvoiceId: null,
        });

        expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledTimes(1);
        expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledWith({
          where: { id: 'inv-old' },
          data: { totalAmount: { increment: -80 } },
        });
      });

      it('applies new invoice only when moving debit→card (oldInvoiceId=null)', async () => {
        const { prisma, tx } = buildPrisma();
        tx.transaction.findFirst.mockResolvedValue({
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: decimal(35),
          invoiceId: null,
        });
        tx.userBankAccount.updateMany
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 });
        tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
        tx.transaction.update.mockResolvedValue({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: ACCOUNT_B,
          categoryId: null,
          invoiceId: 'inv-new',
          type: TransactionType.Expense,
          amount: decimal(35),
          description: null,
          occurredAt: new Date(),
        });
        const repo = new PrismaTransactionsRepository(prisma);

        await repo.edit({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: ACCOUNT_B,
          newInvoiceId: 'inv-new',
        });

        expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledTimes(1);
        expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledWith({
          where: { id: 'inv-new' },
          data: { totalAmount: { increment: 35 } },
        });
      });

      it('skips invoice update when debit→debit (both null)', async () => {
        const { prisma, tx } = buildPrisma();
        tx.transaction.findFirst.mockResolvedValue({
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: decimal(20),
          invoiceId: null,
        });
        tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
        tx.transaction.update.mockResolvedValue({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          categoryId: null,
          invoiceId: null,
          type: TransactionType.Expense,
          amount: decimal(25),
          description: null,
          occurredAt: new Date(),
        });
        const repo = new PrismaTransactionsRepository(prisma);

        await repo.edit({
          id: TRANSACTION_ID,
          userId: CURRENT_USER,
          amount: 25,
          newInvoiceId: null,
        });

        expect(tx.creditCardInvoice.updateMany).not.toHaveBeenCalled();
      });
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

    it('reverses invoice.total_amount when the transaction had an invoice_id', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue({
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: decimal(120),
        invoiceId: 'inv-1',
      });
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.delete(TRANSACTION_ID, CURRENT_USER);

      // expense of 120 had added +120 to invoice; delete subtracts -120
      expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { totalAmount: { increment: -120 } },
      });
    });

    it('does not touch invoices when the transaction had no invoice_id (debit)', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst.mockResolvedValue({
        accountId: ACCOUNT_A,
        type: TransactionType.Expense,
        amount: decimal(50),
        invoiceId: null,
      });
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.delete(TRANSACTION_ID, CURRENT_USER);

      expect(tx.creditCardInvoice.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('addMany', () => {
    it('runs all adds inside a single $transaction and returns them in order', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.transaction.create
        .mockResolvedValueOnce({
          id: 't-1',
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          categoryId: null,
          invoiceId: null,
          type: TransactionType.Expense,
          amount: decimal(10),
          description: null,
          occurredAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 't-2',
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          categoryId: null,
          invoiceId: null,
          type: TransactionType.Expense,
          amount: decimal(25),
          description: null,
          occurredAt: new Date(),
        });
      const repo = new PrismaTransactionsRepository(prisma);

      const result = await repo.addMany([
        {
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: 10,
          occurredAt: new Date(),
        },
        {
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: 25,
          occurredAt: new Date(),
        },
      ]);

      expect(result.map((r) => r.id)).toEqual(['t-1', 't-2']);
      expect(tx.userBankAccount.updateMany).toHaveBeenCalledTimes(2);
      expect(tx.transaction.create).toHaveBeenCalledTimes(2);
    });

    it('aborts the batch when any item references an unowned account (Prisma rolls back)', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      tx.transaction.create.mockResolvedValueOnce({
        id: 't-1',
        userId: CURRENT_USER,
        accountId: ACCOUNT_A,
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: decimal(10),
        description: null,
        occurredAt: new Date(),
      });
      const repo = new PrismaTransactionsRepository(prisma);

      await expect(
        repo.addMany([
          {
            userId: CURRENT_USER,
            accountId: ACCOUNT_A,
            type: TransactionType.Expense,
            amount: 10,
            occurredAt: new Date(),
          },
          {
            userId: CURRENT_USER,
            accountId: 'foreign',
            type: TransactionType.Expense,
            amount: 25,
            occurredAt: new Date(),
          },
        ]),
      ).rejects.toBeInstanceOf(AccountNotFoundError);
    });
  });

  describe('editMany', () => {
    it('applies each edit inside the same $transaction', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transaction.findFirst
        .mockResolvedValueOnce({
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: decimal(40),
        })
        .mockResolvedValueOnce({
          accountId: ACCOUNT_A,
          type: TransactionType.Expense,
          amount: decimal(20),
        });
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.transaction.update
        .mockResolvedValueOnce({
          id: 't-1',
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          categoryId: null,
          invoiceId: null,
          type: TransactionType.Expense,
          amount: decimal(50),
          description: null,
          occurredAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 't-2',
          userId: CURRENT_USER,
          accountId: ACCOUNT_A,
          categoryId: 'cat-1',
          invoiceId: null,
          type: TransactionType.Expense,
          amount: decimal(20),
          description: null,
          occurredAt: new Date(),
        });
      const repo = new PrismaTransactionsRepository(prisma);

      const result = await repo.editMany([
        { id: 't-1', userId: CURRENT_USER, amount: 50 },
        { id: 't-2', userId: CURRENT_USER, categoryId: 'cat-1' },
      ]);

      expect(result.map((r) => r.id)).toEqual(['t-1', 't-2']);
      expect(tx.transaction.findFirst).toHaveBeenCalledTimes(2);
      expect(tx.transaction.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('list', () => {
    const buildListPrisma = () => {
      const findMany = jest.fn();
      const prisma = {
        transaction: { findMany },
      } as unknown as PrismaService;
      return { prisma, findMany };
    };

    it('returns rows enriched with account (nickname + bankName), category, and signedAmount', async () => {
      const { prisma, findMany } = buildListPrisma();
      findMany.mockResolvedValue([
        {
          id: 't-1',
          userId: CURRENT_USER,
          accountId: 'acc-1',
          categoryId: 'cat-1',
          invoiceId: null,
          type: TransactionType.Expense,
          amount: decimal(120.5),
          description: 'Groceries',
          occurredAt: new Date('2026-08-06'),
          account: {
            id: 'acc-1',
            nickname: 'Main',
            bank: { name: 'Nubank' },
          },
          category: {
            id: 'cat-1',
            name: 'Groceries',
            icon: '🛒',
            color: '#22c55e',
          },
        },
        {
          id: 't-2',
          userId: CURRENT_USER,
          accountId: 'acc-1',
          categoryId: null,
          invoiceId: null,
          type: TransactionType.Income,
          amount: decimal(2000),
          description: 'Payroll',
          occurredAt: new Date('2026-08-01'),
          account: {
            id: 'acc-1',
            nickname: 'Main',
            bank: { name: 'Nubank' },
          },
          category: null,
        },
      ]);
      const repo = new PrismaTransactionsRepository(prisma);

      const result = await repo.list({
        userId: CURRENT_USER,
        limit: 50,
        offset: 0,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 't-1',
        userId: CURRENT_USER,
        accountId: 'acc-1',
        categoryId: 'cat-1',
        invoiceId: null,
        type: TransactionType.Expense,
        amount: 120.5,
        description: 'Groceries',
        occurredAt: new Date('2026-08-06'),
        account: { id: 'acc-1', nickname: 'Main', bankName: 'Nubank' },
        category: {
          id: 'cat-1',
          name: 'Groceries',
          icon: '🛒',
          color: '#22c55e',
        },
        signedAmount: -120.5,
        dayGroupKey: '2026-08-06',
      });
      expect(result[1].category).toBeNull();
      expect(result[1].signedAmount).toBe(2000);
      expect(result[1].dayGroupKey).toBe('2026-08-01');
    });

    it('requests the account and category joins on the Prisma select', async () => {
      const { prisma, findMany } = buildListPrisma();
      findMany.mockResolvedValue([]);
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.list({ userId: CURRENT_USER, limit: 50, offset: 0 });

      const [firstCall] = findMany.mock.calls as [
        [
          {
            select: {
              account: { select: { nickname: boolean; bank: unknown } };
              category: { select: { name: boolean } };
            };
          },
        ],
      ];
      const args = firstCall[0];
      expect(args.select.account.select.nickname).toBe(true);
      expect(args.select.account.select.bank).toEqual({
        select: { name: true },
      });
      expect(args.select.category.select.name).toBe(true);
    });
  });

  describe('summarize', () => {
    const buildSummarizePrisma = () => {
      const groupBy = jest.fn();
      const prisma = {
        transaction: { groupBy },
      } as unknown as PrismaService;
      return { prisma, groupBy };
    };

    it('returns Postgres-aggregated totals grouped by transaction type', async () => {
      const { prisma, groupBy } = buildSummarizePrisma();
      groupBy.mockResolvedValue([
        {
          type: TransactionType.Income,
          _sum: { amount: aggregateDecimal(2000) },
        },
        {
          type: TransactionType.Expense,
          _sum: { amount: aggregateDecimal(420.5) },
        },
      ]);
      const repo = new PrismaTransactionsRepository(prisma);

      const summary = await repo.summarize({
        userId: CURRENT_USER,
        limit: 50,
        offset: 0,
      });

      expect(summary).toEqual({
        totalIncome: 2000,
        totalExpense: 420.5,
        net: 1579.5,
      });
    });

    it('forwards the same filters used by list to the groupBy where clause', async () => {
      const { prisma, groupBy } = buildSummarizePrisma();
      groupBy.mockResolvedValue([]);
      const repo = new PrismaTransactionsRepository(prisma);

      await repo.summarize({
        userId: CURRENT_USER,
        dateFrom: new Date('2026-08-01T00:00:00Z'),
        dateTo: new Date('2026-08-31T23:59:59Z'),
        accountIds: ['acc-1'],
        categoryIds: ['cat-1'],
        types: [TransactionType.Expense],
        textSearch: 'coffee',
        limit: 50,
        offset: 0,
      });

      const [firstCall] = groupBy.mock.calls as [
        [{ by: string[]; where: Record<string, unknown>; _sum: unknown }],
      ];
      const args = firstCall[0];
      expect(args.by).toEqual(['type']);
      expect(args._sum).toEqual({ amount: true });
      expect(args.where).toEqual({
        userId: CURRENT_USER,
        occurredAt: {
          gte: new Date('2026-08-01T00:00:00Z'),
          lte: new Date('2026-08-31T23:59:59Z'),
        },
        accountId: { in: ['acc-1'] },
        categoryId: { in: ['cat-1'] },
        type: { in: [TransactionType.Expense] },
        description: { contains: 'coffee', mode: 'insensitive' },
      });
    });

    it('returns a zero summary when there are no rows', async () => {
      const { prisma, groupBy } = buildSummarizePrisma();
      groupBy.mockResolvedValue([]);
      const repo = new PrismaTransactionsRepository(prisma);

      const summary = await repo.summarize({
        userId: CURRENT_USER,
        limit: 50,
        offset: 0,
      });

      expect(summary).toEqual({ totalIncome: 0, totalExpense: 0, net: 0 });
    });

    it('handles a missing group (only income, no expenses) as zero on the other side', async () => {
      const { prisma, groupBy } = buildSummarizePrisma();
      groupBy.mockResolvedValue([
        {
          type: TransactionType.Income,
          _sum: { amount: aggregateDecimal(500) },
        },
      ]);
      const repo = new PrismaTransactionsRepository(prisma);

      const summary = await repo.summarize({
        userId: CURRENT_USER,
        limit: 50,
        offset: 0,
      });

      expect(summary).toEqual({
        totalIncome: 500,
        totalExpense: 0,
        net: 500,
      });
    });
  });

  describe('getMonthlyFlow', () => {
    const buildQueryRawPrisma = () => {
      const $queryRaw = jest.fn();
      const prisma = { $queryRaw } as unknown as PrismaService;
      return { prisma, $queryRaw };
    };

    it('returns the raw rows straight from $queryRaw', async () => {
      const { prisma, $queryRaw } = buildQueryRawPrisma();
      const raw = [
        { monthKey: '2026-03', income: 3000, expense: 1200 },
        { monthKey: '2026-04', income: 3200, expense: 900 },
      ];
      $queryRaw.mockResolvedValue(raw);
      const repo = new PrismaTransactionsRepository(prisma);

      const rows = await repo.getMonthlyFlow({
        userId: CURRENT_USER,
        now: new Date('2026-08-15T12:00:00Z'),
        monthsBack: 6,
      });

      expect(rows).toBe(raw);
      expect($queryRaw).toHaveBeenCalledTimes(1);
    });

    it('passes parameterized args to $queryRaw and SQL zero-pads via generate_series', async () => {
      const { prisma, $queryRaw } = buildQueryRawPrisma();
      $queryRaw.mockResolvedValue([]);
      const repo = new PrismaTransactionsRepository(prisma);
      const now = new Date('2026-08-15T12:00:00Z');

      await repo.getMonthlyFlow({
        userId: CURRENT_USER,
        now,
        monthsBack: 6,
      });

      const call = $queryRaw.mock.calls[0] as [string[], ...unknown[]];
      expect(call.slice(1)).toEqual([now, 6, CURRENT_USER, now, 6]);
      const fullSql = call[0].join('$');
      expect(fullSql).toContain('generate_series');
      expect(fullSql).toContain("date_trunc('month'");
      expect(fullSql).toContain('LEFT JOIN');
      expect(fullSql).toContain('CASE WHEN');
    });

    it('returns empty list when SQL yields no rows', async () => {
      const { prisma, $queryRaw } = buildQueryRawPrisma();
      $queryRaw.mockResolvedValue([]);
      const repo = new PrismaTransactionsRepository(prisma);

      const rows = await repo.getMonthlyFlow({
        userId: CURRENT_USER,
        now: new Date('2026-08-15T12:00:00Z'),
        monthsBack: 6,
      });

      expect(rows).toEqual([]);
    });
  });
});
