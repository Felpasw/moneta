import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
import { CreditCardCycleService } from '../../../card-billing/domain/services/credit-card-cycle.service';
import { TransactionType } from '../../domain/constants/transaction-type';
import { IncomeOnCreditCardNotAllowedError } from '../../domain/errors/income-on-credit-card-not-allowed.error';
import {
  TRANSACTIONS_REPOSITORY,
  type AddTransactionInput,
  type Transaction,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class AddTransactionUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
    private readonly getAccount: GetAccountByIdUseCase,
    private readonly cycle: CreditCardCycleService,
  ) {}

  async execute(input: AddTransactionInput): Promise<Transaction> {
    const account = await this.getAccount.execute({
      id: input.accountId,
      userId: input.userId,
    });
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }

    if (input.type === TransactionType.Income && account.creditLimit !== null) {
      throw new IncomeOnCreditCardNotAllowedError(input.accountId);
    }

    let invoiceId = input.invoiceId;
    if (
      account.creditLimit !== null &&
      account.closeDay !== null &&
      account.dueDay !== null
    ) {
      const invoice = await this.cycle.resolveInvoiceForDate({
        accountId: input.accountId,
        date: input.occurredAt,
        closeDay: account.closeDay,
        dueDay: account.dueDay,
      });
      invoiceId = invoice.id;
    }

    return this.transactions.add({ ...input, invoiceId });
  }
}
