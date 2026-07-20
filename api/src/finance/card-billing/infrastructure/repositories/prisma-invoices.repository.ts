import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { InvoiceStatus } from '../../domain/constants/invoice-status';
import { MultipleOpenInvoicesError } from '../../domain/errors/multiple-open-invoices.error';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoicesRepository,
} from '../../domain/ports/invoices-repository';

const INVOICE_SELECT = {
  id: true,
  accountId: true,
  status: true,
  cycleStart: true,
  cycleEnd: true,
  dueDate: true,
  totalAmount: true,
  closedAt: true,
  paidAt: true,
  paidViaTransferId: true,
} satisfies Prisma.CreditCardInvoiceSelect;

type PrismaInvoiceRow = Prisma.CreditCardInvoiceGetPayload<{
  select: typeof INVOICE_SELECT;
}>;

const toDomain = (row: PrismaInvoiceRow): Invoice => ({
  ...row,
  status: row.status as InvoiceStatus,
  totalAmount: row.totalAmount.toNumber(),
});

@Injectable()
export class PrismaInvoicesRepository implements InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateInvoiceInput): Promise<Invoice> {
    return this.prisma.$transaction(async (tx) => {
      const existingOpen = await tx.creditCardInvoice.findFirst({
        where: { accountId: input.accountId, status: InvoiceStatus.Open },
        select: { id: true },
      });
      if (existingOpen) {
        throw new MultipleOpenInvoicesError(input.accountId);
      }
      const row = await tx.creditCardInvoice.create({
        data: {
          accountId: input.accountId,
          status: InvoiceStatus.Open,
          cycleStart: input.cycleStart,
          cycleEnd: input.cycleEnd,
          dueDate: input.dueDate,
        },
        select: INVOICE_SELECT,
      });
      return toDomain(row);
    });
  }

  async findOpenForAccount(accountId: string): Promise<Invoice | null> {
    const row = await this.prisma.creditCardInvoice.findFirst({
      where: { accountId, status: InvoiceStatus.Open },
      select: INVOICE_SELECT,
    });
    return row ? toDomain(row) : null;
  }

  async findByAccountAndCycle(
    accountId: string,
    cycleStart: Date,
  ): Promise<Invoice | null> {
    const row = await this.prisma.creditCardInvoice.findFirst({
      where: { accountId, cycleStart },
      select: INVOICE_SELECT,
    });
    return row ? toDomain(row) : null;
  }

  async listByAccount(
    accountId: string,
    status?: InvoiceStatus,
  ): Promise<Invoice[]> {
    const rows = await this.prisma.creditCardInvoice.findMany({
      where: { accountId, status },
      orderBy: { cycleStart: 'desc' },
      select: INVOICE_SELECT,
    });
    return rows.map(toDomain);
  }

  async findByIdForUser(id: string, userId: string): Promise<Invoice | null> {
    const row = await this.prisma.creditCardInvoice.findFirst({
      where: { id, account: { userId } },
      select: INVOICE_SELECT,
    });
    return row ? toDomain(row) : null;
  }

  async markPaid(
    id: string,
    paidAt: Date,
    paidViaTransferId?: string,
  ): Promise<void> {
    await this.prisma.creditCardInvoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.Paid,
        paidAt,
        paidViaTransferId,
      },
    });
  }
}
