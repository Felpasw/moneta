import type { UseSuspenseQueryResult } from "@tanstack/react-query";

import type { ListTransactionsResult } from "@/services/interfaces/transactions.interface";

export interface TransactionsHooksResult {
  list: UseSuspenseQueryResult<ListTransactionsResult>;
}

export interface ITransactionsHooks {
  use(): TransactionsHooksResult;
}
