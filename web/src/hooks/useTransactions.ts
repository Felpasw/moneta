/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `transactionsHooks.use()` acontece
 * durante o render em ordem estável, então Rules of Hooks (runtime) segue
 * respeitada. Regra: `use()` chama todos os hooks no topo em ordem fixa, sem
 * `if`/loop.
 */

import { useSuspenseQuery } from "@tanstack/react-query";

import transactionsService from "@/services/transactions.service";
import type {
  ListTransactionsFilters,
  ListTransactionsResult,
} from "@/services/interfaces/transactions.interface";

import type {
  ITransactionsHooks,
  TransactionsHooksResult,
} from "./interfaces/useTransactions.interface";

export const TRANSACTIONS_QUERY_KEYS = {
  all: ["transactions"] as const,
  list: (filters?: ListTransactionsFilters) =>
    ["transactions", "list", filters ?? {}] as const,
};

class TransactionsHooks implements ITransactionsHooks {
  use(filters?: ListTransactionsFilters): TransactionsHooksResult {
    const list = useSuspenseQuery<ListTransactionsResult>({
      queryKey: TRANSACTIONS_QUERY_KEYS.list(filters),
      queryFn: () => transactionsService.list(filters),
    });

    return { list };
  }
}

const transactionsHooks = new TransactionsHooks();

export default transactionsHooks;
