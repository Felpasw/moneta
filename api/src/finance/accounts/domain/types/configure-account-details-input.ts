export interface AccountDetailsUpdate {
  accountId: string;
  creditLimit?: number;
  closeDay?: number;
  dueDay?: number;
  overdraftLimit?: number;
}

export interface ConfigureAccountDetailsInput {
  userId: string;
  accounts: AccountDetailsUpdate[];
}
