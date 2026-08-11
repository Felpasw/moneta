import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import transactionsHooks, {
  TRANSACTIONS_QUERY_KEYS,
} from "@/hooks/useTransactions";
import transactionsService from "@/services/transactions.service";
import type { ListTransactionsResult } from "@/services/interfaces/transactions.interface";

vi.mock("@/services/transactions.service", () => ({
  default: {
    list: vi.fn(),
  },
}));

const mockedService = vi.mocked(transactionsService);

const LIST_RESULT: ListTransactionsResult = {
  items: [],
  summary: { totalIncome: 0, totalExpense: 0, net: 0 },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );

  return { queryClient, Wrapper };
};

describe("transactionsHooks.use()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("list — suspende até resolver e cacheia na query key correta", async () => {
    mockedService.list.mockResolvedValueOnce(LIST_RESULT);
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => transactionsHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.list.data).toEqual(LIST_RESULT);
    expect(queryClient.getQueryData(TRANSACTIONS_QUERY_KEYS.list)).toEqual(
      LIST_RESULT,
    );
    expect(mockedService.list).toHaveBeenCalledTimes(1);
  });
});
