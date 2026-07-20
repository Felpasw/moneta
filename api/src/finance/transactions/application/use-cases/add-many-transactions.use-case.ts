import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
import type { UserBankAccount } from '../../../accounts/domain/ports/user-bank-accounts-repository';
import { CreditCardCycleService } from '../../../card-billing/domain/services/credit-card-cycle.service';
import {
  TRANSACTIONS_REPOSITORY,
  type AddTransactionInput,
  type Transaction,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class AddManyTransactionsUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
    private readonly getAccount: GetAccountByIdUseCase,
    private readonly cycle: CreditCardCycleService,
  ) {}

  async execute(inputs: AddTransactionInput[]): Promise<Transaction[]> {
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
        account = fetched;
        accountCache.set(input.accountId, account);
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

      const enrichedInput: AddTransactionInput =
        invoiceId === undefined ? input : { ...input, invoiceId };
      enriched.push(enrichedInput);
    }

    return this.transactions.addMany(enriched);
  }
}
