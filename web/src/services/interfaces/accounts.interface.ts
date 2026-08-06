import type { Bank } from "./banks.interface";

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

export interface UserBankAccountWithBank extends UserBankAccount {
  bank: Bank;
}

export interface AccountsSummary {
  totalBalance: number;
  checkingCount: number;
  totalOverdraft: number;
}

export interface ListAccountsResult {
  items: UserBankAccountWithBank[];
  summary: AccountsSummary;
}

export interface AddBankAccountInput {
  bankId: string;
  nickname: string;
  initialBalance?: number;
  creditLimit?: number;
  overdraftLimit?: number;
  closeDay?: number;
  dueDay?: number;
}

export interface UpdateBankAccountInput {
  nickname?: string;
  creditLimit?: number;
  overdraftLimit?: number;
  closeDay?: number;
  dueDay?: number;
}

export interface SetBalanceInput {
  amount: number;
}

export interface IAccountsService {
  list(): Promise<ListAccountsResult>;
  create(input: AddBankAccountInput): Promise<UserBankAccount>;
  update(id: string, patch: UpdateBankAccountInput): Promise<UserBankAccount>;
  remove(id: string): Promise<void>;
  setBalance(id: string, patch: SetBalanceInput): Promise<UserBankAccount>;
}
