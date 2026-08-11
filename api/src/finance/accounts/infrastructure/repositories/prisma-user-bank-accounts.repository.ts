import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { computeUsagePct } from '../../../@shared/utils/compute-usage-pct';
import { decimalToNumber } from '../../../@shared/utils/decimal-to-number';
import type {
  AccountsSummary,
  AddUserBankAccountInput,
  BalanceChartPoint,
  CurrentInvoice,
  GetBalanceChartInput,
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
        usagePct: computeUsagePct(
          currentInvoice?.totalAmount ?? 0,
          account.creditLimit,
        ),
      };
    });
  }

  async summarizeCheckings(userId: string): Promise<AccountsSummary> {
    const result = await this.prisma.userBankAccount.aggregate({
      where: { userId, creditLimit: null },
      _sum: { balance: true, overdraftLimit: true },
      _count: { _all: true },
    });
    return {
      totalBalance: decimalToNumber(result._sum.balance),
      checkingCount: result._count._all,
      totalOverdraft: decimalToNumber(result._sum.overdraftLimit),
    };
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

  async getBalanceChart(
    input: GetBalanceChartInput,
  ): Promise<BalanceChartPoint[]> {
    return this.prisma.$queryRaw<BalanceChartPoint[]>`
      WITH day_series AS (
        SELECT ((${input.now}::timestamptz)::date - i * INTERVAL '1 day')::date AS day
        FROM generate_series(0, ${input.days}::int - 1) i
      ),
      day_deltas AS (
        SELECT date_trunc('day', t.occurred_at)::date AS day,
               SUM(CASE WHEN t.type = 'income'::transaction_type
                        THEN t.amount
                        ELSE -t.amount
                   END)::float8 AS delta
        FROM transactions t
        INNER JOIN user_bank_accounts a ON a.id = t.account_id
        WHERE t.user_id = ${input.userId}::uuid
          AND a.credit_limit IS NULL
          AND t.occurred_at >= (((${input.now}::timestamptz)::date - (${input.days}::int - 1) * INTERVAL '1 day'))
        GROUP BY day
      ),
      current_balance AS (
        SELECT COALESCE(SUM(balance), 0)::float8 AS total
        FROM user_bank_accounts
        WHERE user_id = ${input.userId}::uuid AND credit_limit IS NULL
      ),
      combined AS (
        SELECT s.day, COALESCE(dd.delta, 0)::float8 AS delta
        FROM day_series s
        LEFT JOIN day_deltas dd ON dd.day = s.day
      )
      SELECT to_char(c.day, 'YYYY-MM-DD') AS "date",
             (cb.total - COALESCE(
                SUM(c.delta) OVER (
                  ORDER BY c.day DESC
                  ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                ),
                0
             ))::float8 AS balance
      FROM combined c
      CROSS JOIN current_balance cb
      ORDER BY c.day ASC
    `;
  }
}
