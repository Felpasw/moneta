import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import { signedAmount } from '../../../../transactions/domain/utils/signed-amount';
import type {
  CreatedInstallmentPurchase,
  InstallmentGroup,
  InstallmentGroupsRepository,
  InstallmentTransactionInput,
} from '../../domain/ports/installment-groups-repository';

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
}
