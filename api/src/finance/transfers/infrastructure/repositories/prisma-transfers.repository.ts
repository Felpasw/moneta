import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { TransferNotFoundError } from '../../domain/errors/transfer-not-found.error';
import type {
  CreateTransferInput,
  ListTransfersFilters,
  Transfer,
  TransfersRepository,
} from '../../domain/ports/transfers-repository';

const TRANSFER_SELECT = {
  id: true,
  userId: true,
  fromAccountId: true,
  toAccountId: true,
  amount: true,
  description: true,
  occurredAt: true,
} satisfies Prisma.TransferSelect;

type PrismaTransferRow = Prisma.TransferGetPayload<{
  select: typeof TRANSFER_SELECT;
}>;

const toDomain = (row: PrismaTransferRow): Transfer => ({
  ...row,
  amount: row.amount.toNumber(),
});

@Injectable()
export class PrismaTransfersRepository implements TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTransferInput): Promise<Transfer> {
    return this.prisma.$transaction(async (tx) => {
      const debit = await tx.userBankAccount.updateMany({
        where: { id: input.fromAccountId, userId: input.userId },
        data: { balance: { increment: -input.amount } },
      });
      if (debit.count === 0) {
        throw new AccountNotFoundError(input.fromAccountId);
      }
      const credit = await tx.userBankAccount.updateMany({
        where: { id: input.toAccountId, userId: input.userId },
        data: { balance: { increment: input.amount } },
      });
      if (credit.count === 0) {
        throw new AccountNotFoundError(input.toAccountId);
      }
      const row = await tx.transfer.create({
        data: {
          userId: input.userId,
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          amount: input.amount,
          description: input.description,
          occurredAt: input.occurredAt,
        },
        select: TRANSFER_SELECT,
      });
      return toDomain(row);
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.transfer.findFirst({
        where: { id, userId },
        select: { fromAccountId: true, toAccountId: true, amount: true },
      });
      if (!current) {
        throw new TransferNotFoundError(id);
      }
      const amount = current.amount.toNumber();
      await tx.userBankAccount.updateMany({
        where: { id: current.fromAccountId, userId },
        data: { balance: { increment: amount } },
      });
      await tx.userBankAccount.updateMany({
        where: { id: current.toAccountId, userId },
        data: { balance: { increment: -amount } },
      });
      await tx.transfer.delete({ where: { id } });
    });
  }

  async list(filters: ListTransfersFilters): Promise<Transfer[]> {
    const dateRange =
      filters.dateFrom || filters.dateTo
        ? { gte: filters.dateFrom, lte: filters.dateTo }
        : undefined;
    const accountFilter = filters.accountIds
      ? {
          OR: [
            { fromAccountId: { in: filters.accountIds } },
            { toAccountId: { in: filters.accountIds } },
          ],
        }
      : {};
    const rows = await this.prisma.transfer.findMany({
      where: {
        userId: filters.userId,
        occurredAt: dateRange,
        ...accountFilter,
      },
      orderBy: { occurredAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
      select: TRANSFER_SELECT,
    });
    return rows.map(toDomain);
  }
}
