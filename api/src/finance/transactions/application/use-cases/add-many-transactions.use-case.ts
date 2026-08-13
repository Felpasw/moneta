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
export class AddManyTransactionsUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
    private readonly getAccount: GetAccountByIdUseCase,
  ) {}

  async execute(inputs: AddTransactionInput[]): Promise<Transaction[]> {
    const seen = new Set<string>();
    for (const input of inputs) {
      if (seen.has(input.accountId)) continue;
      const fetched = await this.getAccount.execute({
        id: input.accountId,
        userId: input.userId,
      });
      if (!fetched) throw new AccountNotFoundError(input.accountId);
      seen.add(input.accountId);
    }
    return this.transactions.addMany(inputs);
  }
}
