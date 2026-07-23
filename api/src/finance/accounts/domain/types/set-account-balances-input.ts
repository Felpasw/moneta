export interface AccountBalanceUpdate {
  accountId: string;
  balance: number;
}

export interface SetAccountBalancesInput {
  userId: string;
  balances: AccountBalanceUpdate[];
}
