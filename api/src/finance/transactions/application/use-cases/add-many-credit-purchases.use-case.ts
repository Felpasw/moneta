import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
import type { UserBankAccount } from '../../../accounts/domain/ports/user-bank-accounts-repository';
import { CreditCardCycleService } from '../../../card-billing/domain/services/credit-card-cycle.service';
import { TransactionType } from '../../domain/constants/transaction-type';
import { InvalidCreditPurchaseError } from '../../domain/errors/invalid-credit-purchase.error';
import {
  TRANSACTIONS_REPOSITORY,
  type AddTransactionInput,
  type Transaction,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';
import type { AddCreditPurchaseInput } from '../../domain/types/add-credit-purchase-input';

@Injectable()
export class AddManyCreditPurchasesUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
    private readonly getAccount: GetAccountByIdUseCase,
    private readonly cycle: CreditCardCycleService,
  ) {}

  async execute(inputs: AddCreditPurchaseInput[]): Promise<Transaction[]> {
    const enriched: AddTransactionInput[] = [];
    const accountCache = new Map<string, UserBankAccount>();
    for (const input of inputs) {
      let account = accountCache.get(input.accountId);
      if (!account) {
        const fetched = await this.getAccount.execute({
          id: input.accountId,
          userId: input.userId,
        });
        if (!fetched) throw new AccountNotFoundError(input.accountId);
        if (
          fetched.creditLimit === null ||
          fetched.closeDay === null ||
          fetched.dueDay === null
        ) {
          throw new InvalidCreditPurchaseError(
            `account ${input.accountId} has no credit card configured`,
          );
        }
        account = fetched;
        accountCache.set(input.accountId, account);
      }
      const invoice = await this.cycle.resolveInvoiceForDate({
        accountId: input.accountId,
        date: input.occurredAt,
        closeDay: account.closeDay!,
        dueDay: account.dueDay!,
      });
      enriched.push({
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
    return this.transactions.addMany(enriched);
  }
}
