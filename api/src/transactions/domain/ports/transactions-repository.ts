import type { TransactionType } from '../constants/transaction-type';

export const TRANSACTIONS_REPOSITORY = Symbol('TRANSACTIONS_REPOSITORY');

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  invoiceId: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  occurredAt: Date;
}

export interface AddTransactionInput {
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  description?: string;
  occurredAt: Date;
}

export interface EditTransactionInput {
  id: string;
  userId: string;
  accountId?: string;
  type?: TransactionType;
  amount?: number;
  categoryId?: string | null;
  description?: string | null;
  occurredAt?: Date;
}

export interface ListTransactionsFilters {
  userId: string;
  dateFrom?: Date;
  dateTo?: Date;
  accountIds?: string[];
  categoryIds?: string[];
  types?: TransactionType[];
  textSearch?: string;
  limit: number;
  offset: number;
}

export interface TransactionsRepository {
  add(input: AddTransactionInput): Promise<Transaction>;
  edit(input: EditTransactionInput): Promise<Transaction>;
  delete(id: string, userId: string): Promise<void>;
  list(filters: ListTransactionsFilters): Promise<Transaction[]>;
}
