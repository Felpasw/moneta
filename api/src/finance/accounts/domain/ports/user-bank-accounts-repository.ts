import type { Bank } from '~/finance/banks/domain/ports/banks-repository';
import type { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';

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

export interface CurrentInvoice {
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  cycleStart: Date;
  cycleEnd: Date;
}

export interface UserBankAccountWithBank extends UserBankAccount {
  bank: Bank;
  currentInvoice: CurrentInvoice | null;
  usagePct: number;
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
  listByUserId(userId: string): Promise<UserBankAccountWithBank[]>;
  findById(id: string, userId: string): Promise<UserBankAccount | null>;
  add(input: AddUserBankAccountInput): Promise<UserBankAccount>;
  update(input: UpdateUserBankAccountInput): Promise<UserBankAccount | null>;
  delete(id: string, userId: string): Promise<boolean>;
  setBalance(
    id: string,
    userId: string,
    amount: number,
  ): Promise<UserBankAccount | null>;
}
