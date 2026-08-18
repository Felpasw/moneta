import type { UseSuspenseQueryResult } from "@tanstack/react-query";

import type {
  ListTransactionsFilters,
  ListTransactionsResult,
} from "@/services/interfaces/transactions.interface";

export interface TransactionsHooksResult {
  list: UseSuspenseQueryResult<ListTransactionsResult>;
}

export interface ITransactionsHooks {
  use(filters?: ListTransactionsFilters): TransactionsHooksResult;
}
