import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
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
  ) {}

  async execute(input: AddTransactionInput): Promise<Transaction> {
    const account = await this.getAccount.execute({
      id: input.accountId,
      userId: input.userId,
    });
    if (!account) {
      throw new AccountNotFoundError(input.accountId);
    }
    return this.transactions.add(input);
  }
}
