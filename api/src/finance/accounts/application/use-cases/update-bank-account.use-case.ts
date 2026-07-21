import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type UpdateUserBankAccountInput,
  type UserBankAccount,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

@Injectable()
export class UpdateBankAccountUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: UpdateUserBankAccountInput): Promise<UserBankAccount> {
    const updated = await this.accounts.update(input);
    if (!updated) {
      throw new AccountNotFoundError(input.id);
    }
    return updated;
  }
}
