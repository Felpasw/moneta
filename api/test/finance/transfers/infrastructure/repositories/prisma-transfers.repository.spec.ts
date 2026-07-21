import { Prisma } from '@prisma/client';

import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { TransferNotFoundError } from '~/finance/transfers/domain/errors/transfer-not-found.error';
import { PrismaTransfersRepository } from '~/finance/transfers/infrastructure/repositories/prisma-transfers.repository';

interface MockTx {
  transfer: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  userBankAccount: {
    updateMany: jest.Mock;
  };
}

const buildPrisma = (): {
  prisma: PrismaService;
  tx: MockTx;
  root: { transfer: { findMany: jest.Mock } };
} => {
  const tx: MockTx = {
    transfer: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userBankAccount: {
      updateMany: jest.fn(),
    },
  };
  const $transaction = jest.fn((cb: (t: MockTx) => Promise<unknown>) => cb(tx));
  const root = { transfer: { findMany: jest.fn() } };
  const prisma = {
    $transaction,
    transfer: root.transfer,
  } as unknown as PrismaService;
  return { prisma, tx, root };
};

const decimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

const USER = 'user-1';
const FROM = 'acc-a';
const TO = 'acc-b';
const TRANSFER_ID = 'tr-1';

describe('PrismaTransfersRepository', () => {
  describe('create', () => {
    it('debits the source and credits the destination in one $transaction', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      tx.transfer.create.mockResolvedValue({
        id: TRANSFER_ID,
        userId: USER,
        fromAccountId: FROM,
        toAccountId: TO,
        amount: decimal(150),
        description: null,
        occurredAt: new Date('2026-07-15T12:00:00Z'),
      });
      const repo = new PrismaTransfersRepository(prisma);

      const result = await repo.create({
        userId: USER,
        fromAccountId: FROM,
        toAccountId: TO,
        amount: 150,
        occurredAt: new Date('2026-07-15T12:00:00Z'),
      });

      expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: FROM, userId: USER },
        data: { balance: { increment: -150 } },
      });
      expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: TO, userId: USER },
        data: { balance: { increment: 150 } },
      });
      expect(result.amount).toBe(150);
    });

    it('throws AccountNotFoundError when the source account is not owned by the user', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany.mockResolvedValueOnce({ count: 0 });
      const repo = new PrismaTransfersRepository(prisma);

      await expect(
        repo.create({
          userId: USER,
          fromAccountId: 'foreign',
          toAccountId: TO,
          amount: 10,
          occurredAt: new Date(),
        }),
      ).rejects.toBeInstanceOf(AccountNotFoundError);
      expect(tx.transfer.create).not.toHaveBeenCalled();
    });

    it('throws AccountNotFoundError when the destination account is not owned by the user', async () => {
      const { prisma, tx } = buildPrisma();
      tx.userBankAccount.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      const repo = new PrismaTransfersRepository(prisma);

      await expect(
        repo.create({
          userId: USER,
          fromAccountId: FROM,
          toAccountId: 'foreign',
          amount: 10,
          occurredAt: new Date(),
        }),
      ).rejects.toBeInstanceOf(AccountNotFoundError);
      expect(tx.transfer.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('reverses both balances and deletes the transfer', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transfer.findFirst.mockResolvedValue({
        fromAccountId: FROM,
        toAccountId: TO,
        amount: decimal(80),
      });
      tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
      const repo = new PrismaTransfersRepository(prisma);

      await repo.delete(TRANSFER_ID, USER);

      expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: FROM, userId: USER },
        data: { balance: { increment: 80 } },
      });
      expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: TO, userId: USER },
        data: { balance: { increment: -80 } },
      });
      expect(tx.transfer.delete).toHaveBeenCalledWith({
        where: { id: TRANSFER_ID },
      });
    });

    it('throws TransferNotFoundError when the transfer does not exist for the user', async () => {
      const { prisma, tx } = buildPrisma();
      tx.transfer.findFirst.mockResolvedValue(null);
      const repo = new PrismaTransfersRepository(prisma);

      await expect(repo.delete('ghost', USER)).rejects.toBeInstanceOf(
        TransferNotFoundError,
      );
      expect(tx.userBankAccount.updateMany).not.toHaveBeenCalled();
      expect(tx.transfer.delete).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('applies filters and pagination', async () => {
      const { prisma, root } = buildPrisma();
      root.transfer.findMany.mockResolvedValue([
        {
          id: TRANSFER_ID,
          userId: USER,
          fromAccountId: FROM,
          toAccountId: TO,
          amount: decimal(200),
          description: null,
          occurredAt: new Date('2026-07-15T12:00:00Z'),
        },
      ]);
      const repo = new PrismaTransfersRepository(prisma);

      const result = await repo.list({
        userId: USER,
        dateFrom: new Date('2026-07-01T00:00:00Z'),
        dateTo: new Date('2026-07-31T23:59:59Z'),
        accountIds: [FROM],
        limit: 25,
        offset: 0,
      });

      expect(root.transfer.findMany).toHaveBeenCalledTimes(1);
      const [callArg] = root.transfer.findMany.mock.calls[0] as unknown as [
        { where: unknown; orderBy: unknown; take: number; skip: number },
      ];
      expect(callArg.where).toEqual({
        userId: USER,
        occurredAt: {
          gte: new Date('2026-07-01T00:00:00Z'),
          lte: new Date('2026-07-31T23:59:59Z'),
        },
        OR: [
          { fromAccountId: { in: [FROM] } },
          { toAccountId: { in: [FROM] } },
        ],
      });
      expect(callArg.take).toBe(25);
      expect(callArg.skip).toBe(0);
      expect(callArg.orderBy).toEqual({ occurredAt: 'desc' });
      expect(result[0].amount).toBe(200);
    });
  });
});
