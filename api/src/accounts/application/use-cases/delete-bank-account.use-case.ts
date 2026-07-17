import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../domain/errors/account-not-found.error';
import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

@Injectable()
export class DeleteBankAccountUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<void> {
    const deleted = await this.accounts.delete(input.id, input.userId);
    if (!deleted) {
      throw new AccountNotFoundError(input.id);
    }
  }
}
