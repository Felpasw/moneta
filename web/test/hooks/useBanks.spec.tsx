import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import banksHooks, { BANKS_QUERY_KEYS } from "@/hooks/useBanks";
import banksService from "@/services/banks.service";
import type { Bank } from "@/services/interfaces/banks.interface";

vi.mock("@/services/banks.service", () => ({
  default: {
    list: vi.fn(),
  },
}));

const mockedService = vi.mocked(banksService);

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

const BANKS: Bank[] = [
  { id: "b1", name: "Nubank", compeCode: "260", logoUrl: null },
];

describe("banksHooks.use()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("suspende até resolver e cacheia o catálogo na query key correta", async () => {
      mockedService.list.mockResolvedValueOnce(BANKS);
      const { Wrapper, queryClient } = createWrapper();

      const { result } = renderHook(() => banksHooks.use(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current.list.data).toEqual(BANKS);
      expect(queryClient.getQueryData(BANKS_QUERY_KEYS.list)).toEqual(BANKS);
      expect(mockedService.list).toHaveBeenCalledTimes(1);
    });
  });
});
