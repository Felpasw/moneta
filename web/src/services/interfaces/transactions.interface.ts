export type TransactionType = "expense" | "income";

export interface TransactionAccountEmbed {
  id: string;
  nickname: string;
  bankName: string;
}

export interface TransactionCategoryEmbed {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface TransactionWithEmbeds {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  invoiceId: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  occurredAt: string;
  account: TransactionAccountEmbed;
  category: TransactionCategoryEmbed | null;
  signedAmount: number;
}

export interface TransactionsSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface ListTransactionsResult {
  items: TransactionWithEmbeds[];
  summary: TransactionsSummary;
}

export interface ListTransactionsFilters {
  dateFrom?: string;
  dateTo?: string;
  accountIds?: string[];
  categoryIds?: string[];
  types?: TransactionType[];
  textSearch?: string;
  limit?: number;
  offset?: number;
}

export interface ITransactionsService {
  list(filters?: ListTransactionsFilters): Promise<ListTransactionsResult>;
}
