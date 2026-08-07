import api from "@/api";

import type {
  ITransactionsService,
  ListTransactionsFilters,
  ListTransactionsResult,
} from "./interfaces/transactions.interface";

class TransactionsService implements ITransactionsService {
  async list(
    filters?: ListTransactionsFilters,
  ): Promise<ListTransactionsResult> {
    const { data } = await api.get<ListTransactionsResult>("/transactions", {
      params: filters,
    });

    return data;
  }
}

const transactionsService = new TransactionsService();

export default transactionsService;
