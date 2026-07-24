import { Inject, Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { AccountNotFoundError } from '../../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../../accounts/application/use-cases/get-account-by-id.use-case';
import { TransactionType } from '../../../../transactions/domain/constants/transaction-type';
import { CreditCardCycleService } from '../../../domain/services/credit-card-cycle.service';
import { InstallmentPurchaseNotAllowedError } from '../../domain/errors/installment-purchase-not-allowed.error';
import { InvalidInstallmentAmountsError } from '../../domain/errors/invalid-installment-amounts.error';
import { InvalidInstallmentsCountError } from '../../domain/errors/invalid-installments-count.error';
import {
  INSTALLMENT_GROUPS_REPOSITORY,
  type CreatedInstallmentPurchase,
  type InstallmentGroupsRepository,
  type InstallmentTransactionInput,
} from '../../domain/ports/installment-groups-repository';
import type { AddInstallmentPurchaseInput } from '../../domain/types/add-installment-purchase-input';

dayjs.extend(utc);

const roundCents = (n: number): number => Math.round(n * 100) / 100;
const floorCents = (n: number): number => Math.floor(n * 100) / 100;

@Injectable()
export class AddInstallmentPurchaseUseCase {
  constructor(
    @Inject(INSTALLMENT_GROUPS_REPOSITORY)
    private readonly groups: InstallmentGroupsRepository,
    private readonly getAccount: GetAccountByIdUseCase,
    private readonly cycle: CreditCardCycleService,
  ) {}

  async execute(
    input: AddInstallmentPurchaseInput,
  ): Promise<CreatedInstallmentPurchase> {
    if (input.installmentsCount < 2) {
      throw new InvalidInstallmentsCountError(input.installmentsCount);
    }

    const { totalAmount, installmentAmount } = this.resolveAmounts(input);

    const account = await this.getAccount.execute({
      id: input.accountId,
      userId: input.userId,
    });
    if (!account) throw new AccountNotFoundError(input.accountId);
    if (
      account.creditLimit === null ||
      account.closeDay === null ||
      account.dueDay === null
    ) {
      throw new InstallmentPurchaseNotAllowedError(input.accountId);
    }

    const purchase = dayjs.utc(input.occurredAt);
    const indexes = Array.from(
      { length: input.installmentsCount },
      (_, idx) => idx + 1,
    );
    const installments: InstallmentTransactionInput[] = await Promise.all(
      indexes.map(async (i) => {
        const date = purchase.add(i - 1, 'month').toDate();
        const invoice = await this.cycle.resolveInvoiceForDate({
          accountId: input.accountId,
          date,
          closeDay: account.closeDay!,
          dueDay: account.dueDay!,
        });
        const amount = this.amountForInstallment({
          index: i,
          installmentsCount: input.installmentsCount,
          installmentAmount,
          totalAmount,
        });
        return {
          userId: input.userId,
          accountId: input.accountId,
          categoryId: input.categoryId,
          type: TransactionType.Expense,
          amount,
          description: `${input.description} (${i}/${input.installmentsCount})`,
          occurredAt: date,
          invoiceId: invoice.id,
          installmentNumber: i,
        };
      }),
    );

    return this.groups.createGroupWithInstallments({
      group: {
        userId: input.userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        totalAmount,
        installmentsCount: input.installmentsCount,
        installmentAmount,
        description: input.description,
        purchaseDate: input.occurredAt,
      },
      installments,
    });
  }

  private resolveAmounts(input: AddInstallmentPurchaseInput): {
    totalAmount: number;
    installmentAmount: number;
  } {
    if (input.totalAmount !== undefined && input.totalAmount > 0) {
      const installmentAmount = floorCents(
        input.totalAmount / input.installmentsCount,
      );
      return { totalAmount: roundCents(input.totalAmount), installmentAmount };
    }
    if (input.installmentAmount !== undefined && input.installmentAmount > 0) {
      const total = roundCents(
        input.installmentAmount * input.installmentsCount,
      );
      return {
        totalAmount: total,
        installmentAmount: roundCents(input.installmentAmount),
      };
    }
    throw new InvalidInstallmentAmountsError();
  }

  private amountForInstallment(input: {
    index: number;
    installmentsCount: number;
    installmentAmount: number;
    totalAmount: number;
  }): number {
    if (input.index < input.installmentsCount) return input.installmentAmount;
    // Last installment absorbs rounding residue so sum(installments) === totalAmount
    const soFar = roundCents(
      input.installmentAmount * (input.installmentsCount - 1),
    );
    return roundCents(input.totalAmount - soFar);
  }
}
