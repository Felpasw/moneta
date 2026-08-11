import { Inject, Injectable } from '@nestjs/common';

import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type ListAccountsResult,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

@Injectable()
export class ListMyAccountsUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: { userId: string }): Promise<ListAccountsResult> {
    const [items, summary] = await Promise.all([
      this.accounts.listByUserId(input.userId),
      this.accounts.summarizeCheckings(input.userId),
    ]);
    return { items, summary };
  }
}
