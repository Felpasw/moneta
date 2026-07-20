import { Prisma } from '@prisma/client';

import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { MultipleOpenInvoicesError } from '~/finance/card-billing/domain/errors/multiple-open-invoices.error';
import { PrismaInvoicesRepository } from '~/finance/card-billing/infrastructure/repositories/prisma-invoices.repository';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';

interface MockTx {
  creditCardInvoice: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
}

const buildPrisma = (): {
  prisma: PrismaService;
  tx: MockTx;
  root: { creditCardInvoice: { findFirst: jest.Mock } };
} => {
  const tx: MockTx = {
    creditCardInvoice: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  const $transaction = jest.fn((cb: (t: MockTx) => Promise<unknown>) => cb(tx));
  const root = { creditCardInvoice: { findFirst: jest.fn() } };
  const prisma = {
    $transaction,
    creditCardInvoice: root.creditCardInvoice,
  } as unknown as PrismaService;
  return { prisma, tx, root };
};

const decimal = (n: number): Prisma.Decimal => new Prisma.Decimal(n);

const ACCOUNT_ID = 'acc-1';
const INVOICE_ID = 'inv-1';

const invoiceRow = (overrides: Record<string, unknown> = {}) => ({
  id: INVOICE_ID,
  accountId: ACCOUNT_ID,
  status: InvoiceStatus.Open,
  cycleStart: new Date('2026-07-01T00:00:00Z'),
  cycleEnd: new Date('2026-07-31T00:00:00Z'),
  dueDate: new Date('2026-08-10T00:00:00Z'),
  totalAmount: decimal(0),
  closedAt: null,
  paidAt: null,
  paidViaTransferId: null,
  ...overrides,
});

describe('PrismaInvoicesRepository', () => {
  describe('create', () => {
    it('creates an invoice with status=open when the account has no other open invoice', async () => {
      const { prisma, tx } = buildPrisma();
      tx.creditCardInvoice.findFirst.mockResolvedValue(null);
      tx.creditCardInvoice.create.mockResolvedValue(invoiceRow());
      const repo = new PrismaInvoicesRepository(prisma);

      const result = await repo.create({
        accountId: ACCOUNT_ID,
        cycleStart: new Date('2026-07-01T00:00:00Z'),
        cycleEnd: new Date('2026-07-31T00:00:00Z'),
        dueDate: new Date('2026-08-10T00:00:00Z'),
      });

      expect(tx.creditCardInvoice.findFirst).toHaveBeenCalledWith({
        where: { accountId: ACCOUNT_ID, status: InvoiceStatus.Open },
        select: { id: true },
      });
      expect(tx.creditCardInvoice.create).toHaveBeenCalledTimes(1);
      const [callArg] = tx.creditCardInvoice.create.mock
        .calls[0] as unknown as [{ data: Record<string, unknown> }];
      expect(callArg.data).toEqual({
        accountId: ACCOUNT_ID,
        status: InvoiceStatus.Open,
        cycleStart: new Date('2026-07-01T00:00:00Z'),
        cycleEnd: new Date('2026-07-31T00:00:00Z'),
        dueDate: new Date('2026-08-10T00:00:00Z'),
      });
      expect(result.status).toBe(InvoiceStatus.Open);
      expect(result.totalAmount).toBe(0);
    });

    it('throws MultipleOpenInvoicesError when the account already has an open invoice', async () => {
      const { prisma, tx } = buildPrisma();
      tx.creditCardInvoice.findFirst.mockResolvedValue({ id: 'other-open' });
      const repo = new PrismaInvoicesRepository(prisma);

      await expect(
        repo.create({
          accountId: ACCOUNT_ID,
          cycleStart: new Date('2026-08-01T00:00:00Z'),
          cycleEnd: new Date('2026-08-31T00:00:00Z'),
          dueDate: new Date('2026-09-10T00:00:00Z'),
        }),
      ).rejects.toBeInstanceOf(MultipleOpenInvoicesError);
      expect(tx.creditCardInvoice.create).not.toHaveBeenCalled();
    });
  });

  describe('findOpenForAccount', () => {
    it('returns the open invoice when there is one', async () => {
      const { prisma, root } = buildPrisma();
      root.creditCardInvoice.findFirst.mockResolvedValue(invoiceRow());
      const repo = new PrismaInvoicesRepository(prisma);

      const result = await repo.findOpenForAccount(ACCOUNT_ID);

      expect(root.creditCardInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: ACCOUNT_ID, status: InvoiceStatus.Open },
        }),
      );
      expect(result?.id).toBe(INVOICE_ID);
      expect(result?.status).toBe(InvoiceStatus.Open);
    });

    it('returns null when there is no open invoice', async () => {
      const { prisma, root } = buildPrisma();
      root.creditCardInvoice.findFirst.mockResolvedValue(null);
      const repo = new PrismaInvoicesRepository(prisma);

      const result = await repo.findOpenForAccount(ACCOUNT_ID);

      expect(result).toBeNull();
    });
  });

  describe('findByAccountAndCycle', () => {
    it('queries by the unique (accountId, cycleStart) tuple', async () => {
      const { prisma, root } = buildPrisma();
      const cycleStart = new Date('2026-07-11T00:00:00Z');
      root.creditCardInvoice.findFirst.mockResolvedValue(
        invoiceRow({ cycleStart }),
      );
      const repo = new PrismaInvoicesRepository(prisma);

      const result = await repo.findByAccountAndCycle(ACCOUNT_ID, cycleStart);

      expect(root.creditCardInvoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: ACCOUNT_ID, cycleStart },
        }),
      );
      expect(result?.id).toBe(INVOICE_ID);
    });

    it('returns null when no invoice matches that cycle', async () => {
      const { prisma, root } = buildPrisma();
      root.creditCardInvoice.findFirst.mockResolvedValue(null);
      const repo = new PrismaInvoicesRepository(prisma);

      const result = await repo.findByAccountAndCycle(
        ACCOUNT_ID,
        new Date('2026-07-11T00:00:00Z'),
      );

      expect(result).toBeNull();
    });
  });
});
