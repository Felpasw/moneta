import { Inject, Injectable } from '@nestjs/common';

import { InvalidCreditCardConfigError } from '../../domain/errors/invalid-credit-card-config.error';
import {
  USER_BANK_ACCOUNTS_REPOSITORY,
  type AddUserBankAccountInput,
  type UserBankAccount,
  type UserBankAccountsRepository,
} from '../../domain/ports/user-bank-accounts-repository';

const isPresent = (value: unknown): boolean =>
  value !== undefined && value !== null;

@Injectable()
export class AddBankAccountUseCase {
  constructor(
    @Inject(USER_BANK_ACCOUNTS_REPOSITORY)
    private readonly accounts: UserBankAccountsRepository,
  ) {}

  async execute(input: AddUserBankAccountInput): Promise<UserBankAccount> {
    const creditFields = [input.creditLimit, input.closeDay, input.dueDay];
    const presentCount = creditFields.filter(isPresent).length;
    if (presentCount !== 0 && presentCount !== 3) {
      throw new InvalidCreditCardConfigError();
    }
    return this.accounts.add(input);
  }
}
