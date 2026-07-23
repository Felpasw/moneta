export interface UpdatedAccountBalance {
  accountId: string;
  balance: number;
}

export interface SetAccountBalancesResult {
  updated: UpdatedAccountBalance[];
  notFound: string[];
}
