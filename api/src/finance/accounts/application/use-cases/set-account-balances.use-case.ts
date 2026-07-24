import { Inject, Injectable } from '@nestjs/common';

import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';
import type { SetAccountBalancesInput } from '../../domain/types/set-account-balances-input';
import type {
  SetAccountBalancesResult,
  UpdatedAccountBalance,
} from '../../domain/types/set-account-balances-result';

@Injectable()
export class SetAccountBalancesUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(
    input: SetAccountBalancesInput,
  ): Promise<SetAccountBalancesResult> {
    const results = await Promise.all(
      input.balances.map(async ({ accountId, balance }) => ({
        accountId,
        account: await this.accounts.setBalance(
          accountId,
          input.userId,
          balance,
        ),
      })),
    );

    const updated: UpdatedAccountBalance[] = [];
    const notFound: string[] = [];
    for (const { accountId, account } of results) {
      if (!account) {
        notFound.push(accountId);
        continue;
      }
      updated.push({ accountId: account.id, balance: account.balance });
    }

    return { updated, notFound };
  }
}
