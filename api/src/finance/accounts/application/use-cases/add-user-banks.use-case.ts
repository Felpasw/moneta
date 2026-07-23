import { Inject, Injectable } from '@nestjs/common';

import {
  BANKS_REPOSITORY,
  type BanksRepository,
} from '../../../banks/domain/ports/banks-repository';
import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';
import type { AddUserBanksInput } from '../../domain/types/add-user-banks-input';
import type {
  AddUserBanksResult,
  CreatedAccount,
} from '../../domain/types/add-user-banks-result';

@Injectable()
export class AddUserBanksUseCase {
  constructor(
    @Inject(BANKS_REPOSITORY) private readonly banks: BanksRepository,
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: AddUserBanksInput): Promise<AddUserBanksResult> {
    const uniqueIds = [...new Set(input.bankIds)];
    const banks = await this.banks.findManyByIds(uniqueIds);
    const foundIds = new Set(banks.map((b) => b.id));
    const notFound = uniqueIds.filter((id) => !foundIds.has(id));

    const created: CreatedAccount[] = [];
    for (const bank of banks) {
      const account = await this.accounts.add({
        userId: input.userId,
        bankId: bank.id,
        nickname: bank.name,
        initialBalance: 0,
      });
      created.push({ accountId: account.id, bankName: bank.name });
    }

    return { created, notFound };
  }
}
