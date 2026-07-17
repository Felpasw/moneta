export const USER_BANK_ACCOUNTS_REPOSITORY = Symbol(
  'USER_BANK_ACCOUNTS_REPOSITORY',
);

export interface UserBankAccount {
  id: string;
  userId: string;
  bankId: string;
  nickname: string;
  balance: number;
  creditLimit: number | null;
  overdraftLimit: number | null;
  closeDay: number | null;
  dueDay: number | null;
}

export interface AddUserBankAccountInput {
  userId: string;
  bankId: string;
  nickname: string;
  initialBalance?: number;
  creditLimit?: number;
  closeDay?: number;
  dueDay?: number;
  overdraftLimit?: number;
}

export interface UpdateUserBankAccountInput {
  id: string;
  userId: string;
  nickname?: string;
  creditLimit?: number | null;
  overdraftLimit?: number | null;
  closeDay?: number | null;
  dueDay?: number | null;
}

export interface UserBankAccountsRepository {
  listByUserId(userId: string): Promise<UserBankAccount[]>;
  add(input: AddUserBankAccountInput): Promise<UserBankAccount>;
  update(input: UpdateUserBankAccountInput): Promise<UserBankAccount | null>;
  delete(id: string, userId: string): Promise<boolean>;
  setBalance(
    id: string,
    userId: string,
    amount: number,
  ): Promise<UserBankAccount | null>;
}
