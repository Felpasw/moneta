import { Inject, Injectable } from '@nestjs/common';

import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type BalanceChartPoint,
  type GetBalanceChartInput,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

@Injectable()
export class GetBalanceChartUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: GetBalanceChartInput): Promise<BalanceChartPoint[]> {
    return this.accounts.getBalanceChart(input);
  }
}
