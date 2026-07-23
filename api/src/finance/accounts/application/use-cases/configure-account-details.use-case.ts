import { Inject, Injectable } from '@nestjs/common';

import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type UpdateUserBankAccountInput,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';
import type { ConfigureAccountDetailsInput } from '../../domain/types/configure-account-details-input';
import type {
  ConfigureAccountDetailsResult,
  ConfiguredAccount,
} from '../../domain/types/configure-account-details-result';

@Injectable()
export class ConfigureAccountDetailsUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(
    input: ConfigureAccountDetailsInput,
  ): Promise<ConfigureAccountDetailsResult> {
    const results = await Promise.all(
      input.accounts.map(async (patch) => {
        const update: UpdateUserBankAccountInput = {
          id: patch.accountId,
          userId: input.userId,
          creditLimit: patch.creditLimit,
          closeDay: patch.closeDay,
          dueDay: patch.dueDay,
          overdraftLimit: patch.overdraftLimit,
        };
        const account = await this.accounts.update(update);
        return { accountId: patch.accountId, account };
      }),
    );

    const updated: ConfiguredAccount[] = [];
    const notFound: string[] = [];
    for (const { accountId, account } of results) {
      if (!account) {
        notFound.push(accountId);
        continue;
      }
      updated.push({ accountId });
    }

    return { updated, notFound };
  }
}
