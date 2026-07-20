import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  AddUserBankAccountInput,
  UpdateUserBankAccountInput,
  UserBankAccount,
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

type PrismaAccountRow = Prisma.UserBankAccountGetPayload<{
  select: typeof ACCOUNT_SELECT;
}>;

const toDomain = (row: PrismaAccountRow): UserBankAccount => ({
  ...row,
  balance: row.balance.toNumber(),
  creditLimit: row.creditLimit?.toNumber() ?? null,
  overdraftLimit: row.overdraftLimit?.toNumber() ?? null,
});

@Injectable()
export class PrismaUserBankAccountsRepository implements UserBankAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByUserId(userId: string): Promise<UserBankAccount[]> {
    const rows = await this.prisma.userBankAccount.findMany({
      where: { userId },
      orderBy: { nickname: 'asc' },
      select: ACCOUNT_SELECT,
    });
    return rows.map(toDomain);
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
    return toDomain(row);
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
    return row ? toDomain(row) : null;
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
    return row ? toDomain(row) : null;
  }
}
