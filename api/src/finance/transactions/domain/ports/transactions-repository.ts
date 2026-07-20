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
  invoiceId?: string;
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
  // Target invoice for the edited transaction. Computed by the use-case:
  //   null   → detach any invoice (card→debit move, or the edit stays on a debit)
  //   string → attach to this invoice (card scenario, may equal current invoice or a different one)
  //   undefined (legacy) → repo does not touch invoice_id, leaves current state as-is
  newInvoiceId?: string | null;
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
  addMany(inputs: AddTransactionInput[]): Promise<Transaction[]>;
  edit(input: EditTransactionInput): Promise<Transaction>;
  editMany(inputs: EditTransactionInput[]): Promise<Transaction[]>;
  delete(id: string, userId: string): Promise<void>;
  findById(id: string, userId: string): Promise<Transaction | null>;
  list(filters: ListTransactionsFilters): Promise<Transaction[]>;
}
