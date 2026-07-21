import { Prisma } from '@prisma/client';

import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { InstallmentGroupNotFoundError } from '~/finance/card-billing/installments/domain/errors/installment-group-not-found.error';
import { PrismaInstallmentGroupsRepository } from '~/finance/card-billing/installments/infrastructure/repositories/prisma-installment-groups.repository';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

interface MockTx {
  installmentGroup: { findFirst: jest.Mock; delete: jest.Mock };
  transaction: { findMany: jest.Mock; deleteMany: jest.Mock };
  userBankAccount: { updateMany: jest.Mock };
  creditCardInvoice: { updateMany: jest.Mock };
}

const buildPrisma = (): { prisma: PrismaService; tx: MockTx } => {
  const tx: MockTx = {
    installmentGroup: { findFirst: jest.fn(), delete: jest.fn() },
    transaction: { findMany: jest.fn(), deleteMany: jest.fn() },
    userBankAccount: { updateMany: jest.fn() },
    creditCardInvoice: { updateMany: jest.fn() },
  };
  const $transaction = jest.fn((cb: (t: MockTx) => Promise<unknown>) => cb(tx));
  const prisma = { $transaction } as unknown as PrismaService;
  return { prisma, tx };
};

const decimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

const USER = 'user-1';
const GROUP_ID = 'grp-1';
const CARD = 'card-1';

const txRow = (i: number, invoiceId: string, amount = 400) => ({
  id: `t-${i}`,
  accountId: CARD,
  userId: USER,
  type: TransactionType.Expense,
  amount: decimal(amount),
  invoiceId,
});

describe('PrismaInstallmentGroupsRepository.cancelGroup', () => {
  it('reverts balance and invoice.total_amount for each installment, then deletes txs and group', async () => {
    const { prisma, tx } = buildPrisma();
    tx.installmentGroup.findFirst.mockResolvedValue({ id: GROUP_ID });
    tx.transaction.findMany.mockResolvedValue([
      txRow(1, 'inv-a'),
      txRow(2, 'inv-a'),
      txRow(3, 'inv-b'),
    ]);
    tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
    tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
    tx.transaction.deleteMany.mockResolvedValue({ count: 3 });
    tx.installmentGroup.delete.mockResolvedValue({});
    const repo = new PrismaInstallmentGroupsRepository(prisma);

    const result = await repo.cancelGroup(GROUP_ID, USER);

    // 3 installments × 1 balance update each = 3 total; each is +400 (revert expense delta -400)
    expect(tx.userBankAccount.updateMany).toHaveBeenCalledTimes(3);
    expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: CARD, userId: USER },
      data: { balance: { increment: 400 } },
    });
    // 3 invoice updates: each -400 (invoice grew by +400 on add, cancel shrinks by same)
    expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledTimes(3);
    expect(tx.creditCardInvoice.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'inv-a' },
      data: { totalAmount: { increment: -400 } },
    });
    // Transactions and group deleted in that order
    expect(tx.transaction.deleteMany).toHaveBeenCalledWith({
      where: { installmentGroupId: GROUP_ID },
    });
    expect(tx.installmentGroup.delete).toHaveBeenCalledWith({
      where: { id: GROUP_ID },
    });
    // Summary
    expect(result).toEqual({
      deletedCount: 3,
      affectedInvoiceIds: ['inv-a', 'inv-b'],
      refundedAmount: 1200,
    });
  });

  it('throws InstallmentGroupNotFoundError when the group is missing or not owned', async () => {
    const { prisma, tx } = buildPrisma();
    tx.installmentGroup.findFirst.mockResolvedValue(null);
    const repo = new PrismaInstallmentGroupsRepository(prisma);

    await expect(repo.cancelGroup('ghost', USER)).rejects.toBeInstanceOf(
      InstallmentGroupNotFoundError,
    );
    expect(tx.transaction.deleteMany).not.toHaveBeenCalled();
    expect(tx.installmentGroup.delete).not.toHaveBeenCalled();
  });

  it('skips invoice revert for installments without invoiceId (safety, though normally always set)', async () => {
    const { prisma, tx } = buildPrisma();
    tx.installmentGroup.findFirst.mockResolvedValue({ id: GROUP_ID });
    tx.transaction.findMany.mockResolvedValue([
      { ...txRow(1, 'inv-x'), invoiceId: null },
    ]);
    tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
    tx.transaction.deleteMany.mockResolvedValue({ count: 1 });
    tx.installmentGroup.delete.mockResolvedValue({});
    const repo = new PrismaInstallmentGroupsRepository(prisma);

    const result = await repo.cancelGroup(GROUP_ID, USER);

    expect(tx.creditCardInvoice.updateMany).not.toHaveBeenCalled();
    expect(result.affectedInvoiceIds).toEqual([]);
  });
});
