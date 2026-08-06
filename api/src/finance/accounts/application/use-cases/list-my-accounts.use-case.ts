import { Inject, Injectable } from '@nestjs/common';

import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type AccountsSummary,
  type ListAccountsResult,
  type UserBankAccountWithBank,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

@Injectable()
export class ListMyAccountsUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: { userId: string }): Promise<ListAccountsResult> {
    const items = await this.accounts.listByUserId(input.userId);
    return { items, summary: summarize(items) };
  }
}

const EMPTY_SUMMARY: AccountsSummary = {
  totalBalance: 0,
  checkingCount: 0,
  totalOverdraft: 0,
};

function summarize(items: UserBankAccountWithBank[]): AccountsSummary {
  return items.reduce<AccountsSummary>((acc, item) => {
    if (item.creditLimit !== null) return acc;
    return {
      totalBalance: acc.totalBalance + item.balance,
      checkingCount: acc.checkingCount + 1,
      totalOverdraft: acc.totalOverdraft + (item.overdraftLimit ?? 0),
    };
  }, EMPTY_SUMMARY);
}
