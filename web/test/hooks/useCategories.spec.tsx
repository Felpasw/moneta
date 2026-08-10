import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import categoriesHooks, {
  CATEGORIES_QUERY_KEYS,
} from "@/hooks/useCategories";
import categoriesService from "@/services/categories.service";
import type {
  Category,
  CategoryWithUsage,
} from "@/services/interfaces/categories.interface";

vi.mock("@/services/categories.service", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockedService = vi.mocked(categoriesService);

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

const CATEGORY: Category = {
  id: "cat-1",
  userId: "u-1",
  name: "Groceries",
  icon: "🛒",
  color: "#22c55e",
  monthlyBudget: 1200,
};

const CATEGORY_WITH_USAGE: CategoryWithUsage = {
  ...CATEGORY,
  spent: 422.12,
  usagePct: 35,
  overBudget: false,
};

describe("categoriesHooks.use()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("list — suspende até resolver e cacheia CategoryWithUsage[] na query key", async () => {
    mockedService.list.mockResolvedValueOnce([CATEGORY_WITH_USAGE]);
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => categoriesHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.list.data).toEqual([CATEGORY_WITH_USAGE]);
    expect(queryClient.getQueryData(CATEGORIES_QUERY_KEYS.list)).toEqual([
      CATEGORY_WITH_USAGE,
    ]);
  });

  it("create — chama service.create e invalida a list", async () => {
    mockedService.list.mockResolvedValue([]);
    mockedService.create.mockResolvedValueOnce(CATEGORY);
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => categoriesHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.create.mutateAsync({ name: "Groceries" });
    });

    expect(mockedService.create).toHaveBeenCalledWith({ name: "Groceries" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CATEGORIES_QUERY_KEYS.list,
    });
  });

  it("update — chama service.update(id, patch) e invalida a list", async () => {
    mockedService.list.mockResolvedValue([]);
    mockedService.update.mockResolvedValueOnce(CATEGORY);
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => categoriesHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.update.mutateAsync({
        id: "cat-1",
        patch: { name: "Mercado", monthlyBudget: 1500 },
      });
    });

    expect(mockedService.update).toHaveBeenCalledWith("cat-1", {
      name: "Mercado",
      monthlyBudget: 1500,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CATEGORIES_QUERY_KEYS.list,
    });
  });

  it("remove — chama service.remove(id) e invalida a list", async () => {
    mockedService.list.mockResolvedValue([]);
    mockedService.remove.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => categoriesHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      await result.current.remove.mutateAsync("cat-1");
    });

    expect(mockedService.remove).toHaveBeenCalledWith("cat-1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CATEGORIES_QUERY_KEYS.list,
    });
  });
});
