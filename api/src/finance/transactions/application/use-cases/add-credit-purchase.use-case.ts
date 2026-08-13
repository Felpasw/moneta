import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
import { CreditCardCycleService } from '../../../card-billing/domain/services/credit-card-cycle.service';
import { TransactionType } from '../../domain/constants/transaction-type';
import { InvalidCreditPurchaseError } from '../../domain/errors/invalid-credit-purchase.error';
import {
  TRANSACTIONS_REPOSITORY,
  type Transaction,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';
import type { AddCreditPurchaseInput } from '../../domain/types/add-credit-purchase-input';

@Injectable()
export class AddCreditPurchaseUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
    private readonly getAccount: GetAccountByIdUseCase,
    private readonly cycle: CreditCardCycleService,
  ) {}

  async execute(input: AddCreditPurchaseInput): Promise<Transaction> {
    const account = await this.getAccount.execute({
      id: input.accountId,
      userId: input.userId,
    });
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }
    if (
      account.creditLimit === null ||
      account.closeDay === null ||
      account.dueDay === null
    ) {
      throw new InvalidCreditPurchaseError(
        'account has no credit card configured (creditLimit/closeDay/dueDay)',
      );
    }
    const invoice = await this.cycle.resolveInvoiceForDate({
      accountId: input.accountId,
      date: input.occurredAt,
      closeDay: account.closeDay,
      dueDay: account.dueDay,
    });
    return this.transactions.add({
      userId: input.userId,
      accountId: input.accountId,
      type: TransactionType.Expense,
      amount: input.amount,
      categoryId: input.categoryId,
      description: input.description,
      occurredAt: input.occurredAt,
      invoiceId: invoice.id,
    });
  }
}
