import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
import type { UserBankAccount } from '../../../accounts/domain/ports/user-bank-accounts-repository';
import { CreditCardCycleService } from '../../../card-billing/domain/services/credit-card-cycle.service';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import {
  TRANSACTIONS_REPOSITORY,
  type EditTransactionInput,
  type Transaction,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class EditManyTransactionsUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
    private readonly getAccount: GetAccountByIdUseCase,
    private readonly cycle: CreditCardCycleService,
  ) {}

  async execute(inputs: EditTransactionInput[]): Promise<Transaction[]> {
    const enriched: EditTransactionInput[] = [];
    const accountCache = new Map<string, UserBankAccount>();

    for (const input of inputs) {
      const current = await this.transactions.findById(input.id, input.userId);
      if (!current) throw new TransactionNotFoundError(input.id);

      const newAccountId = input.accountId ?? current.accountId;
      const newOccurredAt = input.occurredAt ?? current.occurredAt;

      let account = accountCache.get(newAccountId);
      if (!account) {
        const fetched = await this.getAccount.execute({
          id: newAccountId,
          userId: input.userId,
        });
        if (!fetched) throw new AccountNotFoundError(newAccountId);
        account = fetched;
        accountCache.set(newAccountId, account);
      }

      let newInvoiceId: string | null = null;
      if (
        account.creditLimit !== null &&
        account.closeDay !== null &&
        account.dueDay !== null
      ) {
        const invoice = await this.cycle.resolveInvoiceForDate({
          accountId: newAccountId,
          date: newOccurredAt,
          closeDay: account.closeDay,
          dueDay: account.dueDay,
        });
        newInvoiceId = invoice.id;
      }

      enriched.push({ ...input, newInvoiceId });
    }

    return this.transactions.editMany(enriched);
  }
}
