import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type UserBankAccount,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

@Injectable()
export class SetBalanceUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: {
    id: string;
    userId: string;
    amount: number;
  }): Promise<UserBankAccount> {
    const updated = await this.accounts.setBalance(
      input.id,
      input.userId,
      input.amount,
    );
    if (!updated) {
      throw new AccountNotFoundError(input.id);
    }
    return updated;
  }
}
