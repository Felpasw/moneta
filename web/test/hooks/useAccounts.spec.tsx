import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import accountsHooks, { ACCOUNTS_QUERY_KEYS } from "@/hooks/useAccounts";
import accountsService from "@/services/accounts.service";
import type {
  ListAccountsResult,
  UserBankAccount,
  UserBankAccountWithBank,
} from "@/services/interfaces/accounts.interface";

vi.mock("@/services/accounts.service", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setBalance: vi.fn(),
  },
}));

const mockedService = vi.mocked(accountsService);

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

const ACCOUNT: UserBankAccount = {
  id: "acc-1",
  userId: "u-1",
  bankId: "b-1",
  nickname: "Main",
  balance: 100,
  creditLimit: null,
  overdraftLimit: 500,
  closeDay: null,
  dueDay: null,
};

const ACCOUNT_WITH_BANK: UserBankAccountWithBank = {
  ...ACCOUNT,
  bank: { id: "b-1", name: "Nubank", compeCode: "260", logoUrl: null },
};

const LIST_RESULT: ListAccountsResult = {
  items: [ACCOUNT_WITH_BANK],
  summary: { totalBalance: 100, checkingCount: 1, totalOverdraft: 500 },
};

const EMPTY_LIST: ListAccountsResult = {
  items: [],
  summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
};

describe("accountsHooks.use()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("list — suspende até resolver e cacheia na query key correta", async () => {
    mockedService.list.mockResolvedValueOnce(LIST_RESULT);
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => accountsHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.list.data).toEqual(LIST_RESULT);
    expect(queryClient.getQueryData(ACCOUNTS_QUERY_KEYS.list)).toEqual(
      LIST_RESULT,
    );
  });

  it("create — invalida a query key da list no sucesso", async () => {
    mockedService.list.mockResolvedValue(EMPTY_LIST);
    mockedService.create.mockResolvedValueOnce(ACCOUNT);
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => accountsHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.create.mutateAsync({
        bankId: "b-1",
        nickname: "Main",
      });
    });

    expect(mockedService.create).toHaveBeenCalledWith({
      bankId: "b-1",
      nickname: "Main",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ACCOUNTS_QUERY_KEYS.list,
    });
  });

  it("update — chama service.update(id, patch) e invalida a list", async () => {
    mockedService.list.mockResolvedValue(EMPTY_LIST);
    mockedService.update.mockResolvedValueOnce(ACCOUNT);
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => accountsHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.update.mutateAsync({
        id: "acc-1",
        patch: { nickname: "Novo" },
      });
    });

    expect(mockedService.update).toHaveBeenCalledWith("acc-1", {
      nickname: "Novo",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ACCOUNTS_QUERY_KEYS.list,
    });
  });

  it("remove — chama service.remove(id) e invalida a list", async () => {
    mockedService.list.mockResolvedValue(EMPTY_LIST);
    mockedService.remove.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => accountsHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.remove.mutateAsync("acc-1");
    });

    expect(mockedService.remove).toHaveBeenCalledWith("acc-1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ACCOUNTS_QUERY_KEYS.list,
    });
  });

  it("setBalance — chama service.setBalance(id, patch) e invalida a list", async () => {
    mockedService.list.mockResolvedValue(EMPTY_LIST);
    mockedService.setBalance.mockResolvedValueOnce(ACCOUNT);
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => accountsHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.setBalance.mutateAsync({
        id: "acc-1",
        patch: { amount: 250 },
      });
    });

    expect(mockedService.setBalance).toHaveBeenCalledWith("acc-1", {
      amount: 250,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ACCOUNTS_QUERY_KEYS.list,
    });
  });
});
