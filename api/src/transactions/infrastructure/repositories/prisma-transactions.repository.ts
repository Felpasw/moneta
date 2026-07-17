import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TransactionType } from '../../domain/constants/transaction-type';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import type {
  AddTransactionInput,
  EditTransactionInput,
  ListTransactionsFilters,
  Transaction,
  TransactionsRepository,
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

type PrismaTransactionRow = Prisma.TransactionGetPayload<{
  select: typeof TRANSACTION_SELECT;
}>;

const toDomain = (row: PrismaTransactionRow): Transaction => ({
  ...row,
  amount: row.amount.toNumber(),
});

@Injectable()
export class PrismaTransactionsRepository implements TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(input: AddTransactionInput): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
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
          type: input.type,
          amount: input.amount,
          description: input.description,
          occurredAt: input.occurredAt,
        },
        select: TRANSACTION_SELECT,
      });
      return toDomain(row);
    });
  }

  async edit(input: EditTransactionInput): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findFirst({
        where: { id: input.id, userId: input.userId },
        select: { accountId: true, type: true, amount: true },
      });
      if (!current) {
        throw new TransactionNotFoundError(input.id);
      }

      const currentAmount = current.amount.toNumber();
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

      const row = await tx.transaction.update({
        where: { id: input.id },
        data: {
          accountId: input.accountId,
          type: input.type,
          amount: input.amount,
          categoryId: input.categoryId,
          description: input.description,
          occurredAt: input.occurredAt,
        },
        select: TRANSACTION_SELECT,
      });
      return toDomain(row);
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findFirst({
        where: { id, userId },
        select: { accountId: true, type: true, amount: true },
      });
      if (!current) {
        throw new TransactionNotFoundError(id);
      }
      const oldEffect = signedAmount(
        current.type as TransactionType,
        current.amount.toNumber(),
      );
      await tx.userBankAccount.updateMany({
        where: { id: current.accountId, userId },
        data: { balance: { increment: 0 - oldEffect } },
      });
      await tx.transaction.delete({ where: { id } });
    });
  }

  async list(filters: ListTransactionsFilters): Promise<Transaction[]> {
    const dateRange =
      filters.dateFrom || filters.dateTo
        ? { gte: filters.dateFrom, lte: filters.dateTo }
        : undefined;
    const rows = await this.prisma.transaction.findMany({
      where: {
        userId: filters.userId,
        occurredAt: dateRange,
        accountId: filters.accountIds ? { in: filters.accountIds } : undefined,
        categoryId: filters.categoryIds
          ? { in: filters.categoryIds }
          : undefined,
        type: filters.types ? { in: filters.types } : undefined,
        description: filters.textSearch
          ? { contains: filters.textSearch, mode: 'insensitive' }
          : undefined,
      },
      orderBy: { occurredAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
      select: TRANSACTION_SELECT,
    });
    return rows.map(toDomain);
  }
}
