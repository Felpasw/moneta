import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import dashboardHooks, { DASHBOARD_QUERY_KEYS } from "@/hooks/useDashboard";
import dashboardService from "@/services/dashboard.service";
import type { DashboardView } from "@/services/interfaces/dashboard.interface";

vi.mock("@/services/dashboard.service", () => ({
  default: {
    getView: vi.fn(),
  },
}));

const mockedService = vi.mocked(dashboardService);

const VIEW: DashboardView = {
  summary: {
    totalBalance: "0.00",
    checkingCount: 0,
    monthIncome: "0.00",
    monthExpense: "0.00",
    monthNet: "0.00",
  },
  topCategories: [],
  monthlyFlow: { rows: [], maxFlow: "0.00" },
  balanceChart: {
    points: [],
    min: "0.00",
    max: "0.00",
    linePath: "",
    areaPath: "",
    lastPoint: null,
  },
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

describe("dashboardHooks.use()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("view — suspende até resolver e cacheia na query key correta", async () => {
    mockedService.getView.mockResolvedValueOnce(VIEW);
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => dashboardHooks.use(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current.view.data).toEqual(VIEW);
    expect(queryClient.getQueryData(DASHBOARD_QUERY_KEYS.view)).toEqual(VIEW);
    expect(mockedService.getView).toHaveBeenCalledTimes(1);
  });
});
