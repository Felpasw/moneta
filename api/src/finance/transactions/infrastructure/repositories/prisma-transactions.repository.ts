import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { decimalToNumber } from '../../../@shared/utils/decimal-to-number';
import { TransactionType } from '../../domain/constants/transaction-type';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import type {
  AddTransactionInput,
  EditTransactionInput,
  ListTransactionsFilters,
  Transaction,
  TransactionWithEmbeds,
  TransactionsRepository,
  TransactionsSummary,
} from '../../domain/ports/transactions-repository';
import { signedAmount } from '../../domain/utils/signed-amount';

const TRANSACTION_SELECT = {
  id: true,
  userId: true,
  accountId: true,
  categoryId: true,
  invoiceId: true,
  type: true,
  amount: true,
  description: true,
  occurredAt: true,
} satisfies Prisma.TransactionSelect;

const TRANSACTION_WITH_EMBEDS_SELECT = {
  ...TRANSACTION_SELECT,
  account: {
    select: {
      id: true,
      nickname: true,
      bank: { select: { name: true } },
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  },
} satisfies Prisma.TransactionSelect;

interface PrismaTransactionRow {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  invoiceId: string | null;
  type: string;
  amount: number;
  description: string | null;
  occurredAt: Date;
}

interface PrismaTransactionWithEmbedsRow extends PrismaTransactionRow {
  account: { id: string; nickname: string; bank: { name: string } };
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

const toDomain = (row: PrismaTransactionRow): Transaction => ({
  ...row,
  type: row.type as TransactionType,
});

const toDomainWithEmbeds = (
  row: PrismaTransactionWithEmbedsRow,
): TransactionWithEmbeds => {
  const { account, category, ...rest } = row;
  const base = toDomain(rest);
  return {
    ...base,
    account: {
      id: account.id,
      nickname: account.nickname,
      bankName: account.bank.name,
    },
    category,
    signedAmount: signedAmount(base.type, base.amount),
    dayGroupKey: base.occurredAt.toISOString().slice(0, 10),
  };
};

const buildWhere = (filters: ListTransactionsFilters) =>
  ({
    userId: filters.userId,
    occurredAt: { gte: filters.dateFrom, lte: filters.dateTo },
    accountId: filters.accountIds && { in: filters.accountIds },
    categoryId: filters.categoryIds && { in: filters.categoryIds },
    type: filters.types && { in: filters.types },
    description: filters.textSearch && {
      contains: filters.textSearch,
      mode: 'insensitive',
    },
  }) satisfies Prisma.TransactionWhereInput;

type TxClient = Parameters<
  Parameters<PrismaService['$transaction']>[0] extends (tx: infer T) => unknown
    ? (tx: T) => void
    : never
>[0];

@Injectable()
export class PrismaTransactionsRepository implements TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(input: AddTransactionInput): Promise<Transaction> {
    return this.prisma.$transaction((tx) => this.addWithinTx(tx, input));
  }

  async addMany(inputs: AddTransactionInput[]): Promise<Transaction[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: Transaction[] = [];
      for (const input of inputs) {
        results.push(await this.addWithinTx(tx, input));
      }
      return results;
    });
  }

  async edit(input: EditTransactionInput): Promise<Transaction> {
    return this.prisma.$transaction((tx) => this.editWithinTx(tx, input));
  }

  async editMany(inputs: EditTransactionInput[]): Promise<Transaction[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: Transaction[] = [];
      for (const input of inputs) {
        results.push(await this.editWithinTx(tx, input));
      }
      return results;
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findFirst({
        where: { id, userId },
        select: { accountId: true, type: true, amount: true, invoiceId: true },
      });
      if (!current) {
        throw new TransactionNotFoundError(id);
      }
      const oldEffect = signedAmount(
        current.type as TransactionType,
        current.amount,
      );
      await tx.userBankAccount.updateMany({
        where: { id: current.accountId, userId },
        data: { balance: { increment: 0 - oldEffect } },
      });
      if (current.invoiceId !== null) {
        // reverse the invoice.total_amount contribution (opposite of Add)
        await tx.creditCardInvoice.updateMany({
          where: { id: current.invoiceId },
          data: { totalAmount: { increment: oldEffect } },
        });
      }
      await tx.transaction.delete({ where: { id } });
    });
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findFirst({
      where: { id, userId },
      select: TRANSACTION_SELECT,
    });
    return row ? toDomain(row) : null;
  }

  async list(
    filters: ListTransactionsFilters,
  ): Promise<TransactionWithEmbeds[]> {
    const rows = await this.prisma.transaction.findMany({
      where: buildWhere(filters),
      orderBy: { occurredAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
      select: TRANSACTION_WITH_EMBEDS_SELECT,
    });
    return rows.map(toDomainWithEmbeds);
  }

  async summarize(
    filters: ListTransactionsFilters,
  ): Promise<TransactionsSummary> {
    const groups = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: buildWhere(filters),
      _sum: { amount: true },
    });
    let totalIncome = 0;
    let totalExpense = 0;
    for (const group of groups) {
      const value = decimalToNumber(group._sum.amount);
      const type = group.type as TransactionType;
      if (type === TransactionType.Income) {
        totalIncome = value;
      } else if (type === TransactionType.Expense) {
        totalExpense = value;
      }
    }
    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  }

  private async addWithinTx(
    tx: TxClient,
    input: AddTransactionInput,
  ): Promise<Transaction> {
    const delta = signedAmount(input.type, input.amount);
    const balanceUpdate = await tx.userBankAccount.updateMany({
      where: { id: input.accountId, userId: input.userId },
      data: { balance: { increment: delta } },
    });
    if (balanceUpdate.count === 0) {
      throw new AccountNotFoundError(input.accountId);
    }
    const row = await tx.transaction.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        invoiceId: input.invoiceId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        occurredAt: input.occurredAt,
      },
      select: TRANSACTION_SELECT,
    });
    if (input.invoiceId !== undefined) {
      // invoice.total_amount tracks what the user owes:
      // expense increases the invoice, income (refund) decreases it — opposite sign of balance delta
      await tx.creditCardInvoice.updateMany({
        where: { id: input.invoiceId },
        data: { totalAmount: { increment: -delta } },
      });
    }
    return toDomain(row);
  }

  private async editWithinTx(
    tx: TxClient,
    input: EditTransactionInput,
  ): Promise<Transaction> {
    const current = await tx.transaction.findFirst({
      where: { id: input.id, userId: input.userId },
      select: {
        accountId: true,
        type: true,
        amount: true,
        invoiceId: true,
      },
    });
    if (!current) {
      throw new TransactionNotFoundError(input.id);
    }

    const currentAmount = current.amount;
    const currentType = current.type as TransactionType;
    const newType = input.type ?? currentType;
    const newAmount = input.amount ?? currentAmount;
    const newAccountId = input.accountId ?? current.accountId;
    const oldEffect = signedAmount(currentType, currentAmount);
    const newEffect = signedAmount(newType, newAmount);

    if (newAccountId === current.accountId) {
      const delta = newEffect - oldEffect;
      if (delta !== 0) {
        await tx.userBankAccount.updateMany({
          where: { id: current.accountId, userId: input.userId },
          data: { balance: { increment: delta } },
        });
      }
    } else {
      await tx.userBankAccount.updateMany({
        where: { id: current.accountId, userId: input.userId },
        data: { balance: { increment: 0 - oldEffect } },
      });
      const newAccountUpdate = await tx.userBankAccount.updateMany({
        where: { id: newAccountId, userId: input.userId },
        data: { balance: { increment: newEffect } },
      });
      if (newAccountUpdate.count === 0) {
        throw new AccountNotFoundError(newAccountId);
      }
    }

    if (input.newInvoiceId !== undefined) {
      const oldInvoiceId = current.invoiceId ?? null;
      const finalInvoiceId = input.newInvoiceId;
      // invoice.total_amount tracks what the user owes:
      // Add's contribution was -signedAmount, so revert = +signedAmount (=oldEffect)
      // and re-apply on the target = -newSignedAmount (=-newEffect)
      const sameInvoice =
        oldInvoiceId !== null && oldInvoiceId === finalInvoiceId;
      if (sameInvoice) {
        const invoiceDelta = oldEffect - newEffect;
        if (invoiceDelta !== 0) {
          await tx.creditCardInvoice.updateMany({
            where: { id: oldInvoiceId },
            data: { totalAmount: { increment: invoiceDelta } },
          });
        }
      } else {
        if (oldInvoiceId !== null) {
          await tx.creditCardInvoice.updateMany({
            where: { id: oldInvoiceId },
            data: { totalAmount: { increment: oldEffect } },
          });
        }
        if (finalInvoiceId !== null) {
          await tx.creditCardInvoice.updateMany({
            where: { id: finalInvoiceId },
            data: { totalAmount: { increment: -newEffect } },
          });
        }
      }
    }

    const row = await tx.transaction.update({
      where: { id: input.id },
      data: {
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId,
        description: input.description,
        occurredAt: input.occurredAt,
        invoiceId: input.newInvoiceId,
      },
      select: TRANSACTION_SELECT,
    });
    return toDomain(row);
  }
}
