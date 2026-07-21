import { Prisma } from '@prisma/client';

import type { PrismaService } from '~/infrastructure/prisma/prisma.service';
import { PrismaInstallmentGroupsRepository } from '~/finance/card-billing/installments/infrastructure/repositories/prisma-installment-groups.repository';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

interface MockTx {
  installmentGroup: { create: jest.Mock };
  transaction: { create: jest.Mock };
  userBankAccount: { updateMany: jest.Mock };
  creditCardInvoice: { updateMany: jest.Mock };
}

const buildPrisma = (): { prisma: PrismaService; tx: MockTx } => {
  const tx: MockTx = {
    installmentGroup: { create: jest.fn() },
    transaction: { create: jest.fn() },
    userBankAccount: { updateMany: jest.fn() },
    creditCardInvoice: { updateMany: jest.fn() },
  };
  const $transaction = jest.fn((cb: (t: MockTx) => Promise<unknown>) => cb(tx));
  const prisma = { $transaction } as unknown as PrismaService;
  return { prisma, tx };
};

const decimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

const USER = 'user-1';
const ACC = 'card-1';

const groupInput = () => ({
  userId: USER,
  accountId: ACC,
  totalAmount: 4800,
  installmentsCount: 12,
  installmentAmount: 400,
  description: 'PS5',
  purchaseDate: new Date('2026-07-15T12:00:00Z'),
});

const parcela = (i: number, overrides: Record<string, unknown> = {}) => ({
  userId: USER,
  accountId: ACC,
  type: TransactionType.Expense,
  amount: 400,
  description: `PS5 (${i}/12)`,
  occurredAt: new Date(Date.UTC(2026, 6 + (i - 1), 15, 12)),
  invoiceId: `inv-${i}`,
  installmentNumber: i,
  ...overrides,
});

describe('PrismaInstallmentGroupsRepository', () => {
  it('creates the group + all N transactions + balance + invoice updates in one $transaction', async () => {
    const { prisma, tx } = buildPrisma();
    tx.installmentGroup.create.mockResolvedValue({
      id: 'grp-1',
      userId: USER,
      accountId: ACC,
      categoryId: null,
      totalAmount: decimal(4800),
      installmentsCount: 12,
      installmentAmount: decimal(400),
      description: 'PS5',
      purchaseDate: groupInput().purchaseDate,
    });
    tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
    tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
    tx.transaction.create.mockImplementation(({ data }: { data: unknown }) =>
      Promise.resolve({
        id: `t-${(data as { installmentNumber: number }).installmentNumber}`,
      }),
    );
    const repo = new PrismaInstallmentGroupsRepository(prisma);

    const result = await repo.createGroupWithInstallments({
      group: groupInput(),
      installments: Array.from({ length: 12 }, (_, idx) => parcela(idx + 1)),
    });

    // 1 group + 12 transactions + 12 balance updates + 12 invoice updates
    expect(tx.installmentGroup.create).toHaveBeenCalledTimes(1);
    expect(tx.transaction.create).toHaveBeenCalledTimes(12);
    expect(tx.userBankAccount.updateMany).toHaveBeenCalledTimes(12);
    expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledTimes(12);
    // Each balance update is -400 (expense delta, signedAmount(Expense, 400) = -400)
    expect(tx.userBankAccount.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: ACC, userId: USER },
      data: { balance: { increment: -400 } },
    });
    // Each invoice increment is +400 (opposite of balance delta, invoice grows with expense)
    expect(tx.creditCardInvoice.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'inv-1' },
      data: { totalAmount: { increment: 400 } },
    });
    expect(result.group.id).toBe('grp-1');
    expect(result.transactionIds).toHaveLength(12);
  });

  it('links every created transaction to the group via installmentGroupId', async () => {
    const { prisma, tx } = buildPrisma();
    tx.installmentGroup.create.mockResolvedValue({
      id: 'grp-1',
      userId: USER,
      accountId: ACC,
      categoryId: null,
      totalAmount: decimal(1500),
      installmentsCount: 3,
      installmentAmount: decimal(500),
      description: 'Moto',
      purchaseDate: groupInput().purchaseDate,
    });
    tx.userBankAccount.updateMany.mockResolvedValue({ count: 1 });
    tx.creditCardInvoice.updateMany.mockResolvedValue({ count: 1 });
    tx.transaction.create.mockResolvedValue({ id: 't-x' });
    const repo = new PrismaInstallmentGroupsRepository(prisma);

    await repo.createGroupWithInstallments({
      group: {
        ...groupInput(),
        installmentsCount: 3,
        installmentAmount: 500,
        totalAmount: 1500,
      },
      installments: [1, 2, 3].map((i) =>
        parcela(i, { amount: 500, description: `Moto (${i}/3)` }),
      ),
    });

    const firstCall = tx.transaction.create.mock.calls[0] as unknown as [
      { data: { installmentGroupId: string; installmentNumber: number } },
    ];
    expect(firstCall[0].data.installmentGroupId).toBe('grp-1');
    expect(firstCall[0].data.installmentNumber).toBe(1);
  });
});
