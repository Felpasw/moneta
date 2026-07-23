export interface CreatedAccount {
  accountId: string;
  bankName: string;
}

export interface AddUserBanksResult {
  created: CreatedAccount[];
  notFound: string[];
}
