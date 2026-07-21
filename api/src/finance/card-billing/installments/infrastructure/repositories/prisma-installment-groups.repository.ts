import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import { TransactionType } from '../../../../transactions/domain/constants/transaction-type';
import { signedAmount } from '../../../../transactions/domain/utils/signed-amount';
import { InstallmentGroupNotFoundError } from '../../domain/errors/installment-group-not-found.error';
import type {
  CreatedInstallmentPurchase,
  InstallmentGroup,
  InstallmentGroupsRepository,
  InstallmentTransactionInput,
} from '../../domain/ports/installment-groups-repository';
import type { CancelInstallmentPurchaseOutput } from '../../domain/types/cancel-installment-purchase-output';

@Injectable()
export class PrismaInstallmentGroupsRepository implements InstallmentGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createGroupWithInstallments(input: {
    group: {
      userId: string;
      accountId: string;
      categoryId?: string;
      totalAmount: number;
      installmentsCount: number;
      installmentAmount: number;
      description: string;
      purchaseDate: Date;
    };
    installments: InstallmentTransactionInput[];
  }): Promise<CreatedInstallmentPurchase> {
    return this.prisma.$transaction(async (tx) => {
      const groupRow = await tx.installmentGroup.create({
        data: {
          userId: input.group.userId,
          accountId: input.group.accountId,
          categoryId: input.group.categoryId,
          totalAmount: input.group.totalAmount,
          installmentsCount: input.group.installmentsCount,
          installmentAmount: input.group.installmentAmount,
          description: input.group.description,
          purchaseDate: input.group.purchaseDate,
        },
      });

      const transactionIds: string[] = [];
      for (const installment of input.installments) {
        const delta = signedAmount(installment.type, installment.amount);
        await tx.userBankAccount.updateMany({
          where: { id: installment.accountId, userId: installment.userId },
          data: { balance: { increment: delta } },
        });
        const row = await tx.transaction.create({
          data: {
            userId: installment.userId,
            accountId: installment.accountId,
            categoryId: installment.categoryId,
            invoiceId: installment.invoiceId,
            installmentGroupId: groupRow.id,
            installmentNumber: installment.installmentNumber,
            type: installment.type,
            amount: installment.amount,
            description: installment.description,
            occurredAt: installment.occurredAt,
          },
        });
        await tx.creditCardInvoice.updateMany({
          where: { id: installment.invoiceId },
          data: { totalAmount: { increment: -delta } },
        });
        transactionIds.push(row.id);
      }

      const group: InstallmentGroup = {
        id: groupRow.id,
        userId: groupRow.userId,
        accountId: groupRow.accountId,
        categoryId: groupRow.categoryId,
        totalAmount: groupRow.totalAmount.toNumber(),
        installmentsCount: groupRow.installmentsCount,
        installmentAmount: groupRow.installmentAmount.toNumber(),
        description: groupRow.description,
        purchaseDate: groupRow.purchaseDate,
      };
      return { group, transactionIds };
    });
  }

  async cancelGroup(
    groupId: string,
    userId: string,
  ): Promise<CancelInstallmentPurchaseOutput> {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.installmentGroup.findFirst({
        where: { id: groupId, userId },
        select: { id: true },
      });
      if (!group) {
        throw new InstallmentGroupNotFoundError(groupId);
      }

      const installments = await tx.transaction.findMany({
        where: { installmentGroupId: groupId },
        select: {
          accountId: true,
          userId: true,
          type: true,
          amount: true,
          invoiceId: true,
        },
      });

      const affectedInvoices = new Set<string>();
      let refundedAmount = 0;
      for (const installment of installments) {
        const amount = installment.amount.toNumber();
        const delta = signedAmount(installment.type as TransactionType, amount);
        await tx.userBankAccount.updateMany({
          where: { id: installment.accountId, userId: installment.userId },
          data: { balance: { increment: -delta } },
        });
        if (installment.invoiceId !== null) {
          await tx.creditCardInvoice.updateMany({
            where: { id: installment.invoiceId },
            data: { totalAmount: { increment: delta } },
          });
          affectedInvoices.add(installment.invoiceId);
        }
        refundedAmount += amount;
      }

      const { count } = await tx.transaction.deleteMany({
        where: { installmentGroupId: groupId },
      });
      await tx.installmentGroup.delete({ where: { id: groupId } });

      return {
        deletedCount: count,
        affectedInvoiceIds: Array.from(affectedInvoices),
        refundedAmount: Math.round(refundedAmount * 100) / 100,
      };
    });
  }
}
