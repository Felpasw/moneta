import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  AddUserBankAccountInput,
  CurrentInvoice,
  UpdateUserBankAccountInput,
  UserBankAccount,
  UserBankAccountWithBank,
  UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

const ACCOUNT_SELECT = {
  id: true,
  userId: true,
  bankId: true,
  nickname: true,
  balance: true,
  creditLimit: true,
  overdraftLimit: true,
  closeDay: true,
  dueDay: true,
} satisfies Prisma.UserBankAccountSelect;

const CURRENT_INVOICE_SELECT = {
  totalAmount: true,
  status: true,
  dueDate: true,
  cycleStart: true,
  cycleEnd: true,
} satisfies Prisma.CreditCardInvoiceSelect;

const ACCOUNT_WITH_BANK_SELECT = {
  ...ACCOUNT_SELECT,
  bank: {
    select: {
      id: true,
      name: true,
      compeCode: true,
      logoUrl: true,
    },
  },
  invoices: {
    where: { status: 'open' as const },
    take: 1,
    orderBy: { cycleStart: 'desc' as const },
    select: CURRENT_INVOICE_SELECT,
  },
} satisfies Prisma.UserBankAccountSelect;

const computeUsagePct = (
  creditLimit: number | null,
  invoice: CurrentInvoice | null,
): number => {
  if (creditLimit === null || creditLimit <= 0 || invoice === null) return 0;
  const raw = invoice.totalAmount / creditLimit;
  const capped = raw > 1 ? 1 : raw;
  return Math.round(capped * 100);
};

@Injectable()
export class PrismaUserBankAccountsRepository implements UserBankAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByUserId(userId: string): Promise<UserBankAccountWithBank[]> {
    const rows = await this.prisma.userBankAccount.findMany({
      where: { userId },
      orderBy: { nickname: 'asc' },
      select: ACCOUNT_WITH_BANK_SELECT,
    });
    return rows.map((row): UserBankAccountWithBank => {
      const { invoices, ...account } = row;
      const firstInvoice = invoices[0];
      const currentInvoice: CurrentInvoice | null = firstInvoice
        ? {
            totalAmount: firstInvoice.totalAmount,
            status: firstInvoice.status as InvoiceStatus,
            dueDate: firstInvoice.dueDate,
            cycleStart: firstInvoice.cycleStart,
            cycleEnd: firstInvoice.cycleEnd,
          }
        : null;
      return {
        ...account,
        currentInvoice,
        usagePct: computeUsagePct(account.creditLimit, currentInvoice),
      };
    });
  }

  async findById(id: string, userId: string): Promise<UserBankAccount | null> {
    const row = await this.prisma.userBankAccount.findFirst({
      where: { id, userId },
      select: ACCOUNT_SELECT,
    });
    return row;
  }

  async add(input: AddUserBankAccountInput): Promise<UserBankAccount> {
    const row = await this.prisma.userBankAccount.create({
      data: {
        userId: input.userId,
        bankId: input.bankId,
        nickname: input.nickname,
        balance: input.initialBalance ?? 0,
        creditLimit: input.creditLimit,
        overdraftLimit: input.overdraftLimit,
        closeDay: input.closeDay,
        dueDay: input.dueDay,
      },
      select: ACCOUNT_SELECT,
    });
    return row;
  }

  async update(
    input: UpdateUserBankAccountInput,
  ): Promise<UserBankAccount | null> {
    const { count } = await this.prisma.userBankAccount.updateMany({
      where: { id: input.id, userId: input.userId },
      data: {
        nickname: input.nickname,
        creditLimit: input.creditLimit,
        overdraftLimit: input.overdraftLimit,
        closeDay: input.closeDay,
        dueDay: input.dueDay,
      },
    });
    if (count === 0) return null;
    const row = await this.prisma.userBankAccount.findUnique({
      where: { id: input.id },
      select: ACCOUNT_SELECT,
    });
    return row;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.userBankAccount.deleteMany({
      where: { id, userId },
    });
    return count > 0;
  }

  async setBalance(
    id: string,
    userId: string,
    amount: number,
  ): Promise<UserBankAccount | null> {
    const { count } = await this.prisma.userBankAccount.updateMany({
      where: { id, userId },
      data: { balance: amount },
    });
    if (count === 0) return null;
    const row = await this.prisma.userBankAccount.findUnique({
      where: { id },
      select: ACCOUNT_SELECT,
    });
    return row;
  }
}
