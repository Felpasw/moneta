import type { UserBankAccount } from '../../../finance/accounts/domain/ports/user-bank-accounts-repository';
import type { UserSnapshot } from '../../../users/domain/ports/users-repository';

export interface DeriveOnboardingStateInput {
  user: UserSnapshot | null;
  accounts: readonly UserBankAccount[];
}
