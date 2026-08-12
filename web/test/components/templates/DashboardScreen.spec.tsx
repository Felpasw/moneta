import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/dashboard.service", () => ({
  default: {
    getView: vi.fn(),
  },
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: Object.assign(
    (selector: (state: { user: unknown }) => unknown) =>
      selector({
        user: {
          id: "u-1",
          email: "felipe@moneta.com",
          name: "Felipe",
          onboardedAt: "2026-01-01",
        },
      }),
    { getState: () => ({ user: null }), setState: () => undefined },
  ),
}));

import { DashboardScreen } from "@/components/templates/DashboardScreen";
import dashboardService from "@/services/dashboard.service";
import type { DashboardView } from "@/services/interfaces/dashboard.interface";

const mockedService = vi.mocked(dashboardService);

const VIEW_POPULATED: DashboardView = {
  summary: {
    totalBalance: "1234.56",
    checkingCount: 1,
    monthIncome: "3200.00",
    monthExpense: "950.00",
    monthNet: "2250.00",
  },
  topCategories: [
    {
      id: "c-1",
      name: "Food",
      icon: "🍔",
      color: "#f00",
      spent: "500.00",
      sharePct: 50,
    },
  ],
  monthlyFlow: {
    rows: [
      {
        monthKey: "2026-08",
        income: "3200.00",
        expense: "950.00",
        incomePct: 100,
        expensePct: 29.69,
      },
      {
        monthKey: "2026-07",
        income: "3000.00",
        expense: "1200.00",
        incomePct: 93.75,
        expensePct: 37.5,
      },
    ],
    maxFlow: "3200.00",
  },
  balanceChart: {
    points: [
      { date: "2026-08-14", balance: "1200.00" },
      { date: "2026-08-15", balance: "1234.56" },
    ],
    min: "1200.00",
    max: "1234.56",
    linePath: "M 0 40 L 100 0",
    areaPath: "M 0 40 L 100 0 L 100 40 L 0 40 Z",
    lastPoint: { x: 100, y: 0 },
  },
};

const VIEW_EMPTY: DashboardView = {
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

const renderScreen = (data: DashboardView) => {
  mockedService.getView.mockResolvedValueOnce(data);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div data-testid="suspense-fallback" />}>
        {children}
      </Suspense>
    </QueryClientProvider>
  );
  return render(
    <Wrapper>
      <DashboardScreen />
    </Wrapper>,
  );
};

describe("<DashboardScreen />", () => {
  it("mostra EmptyState quando checkingCount é zero", async () => {
    renderScreen(VIEW_EMPTY);

    await waitFor(() =>
      expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("region", { name: /key indicators/i }),
    ).toBeNull();
  });

  it("renderiza saudação com nome do user", async () => {
    renderScreen(VIEW_POPULATED);

    await waitFor(() =>
      expect(screen.getByText(/hi, felipe/i)).toBeInTheDocument(),
    );
  });

  it("renderiza KPIs vindo direto do summary do backend", async () => {
    renderScreen(VIEW_POPULATED);

    const region = await screen.findByRole("region", {
      name: /key indicators/i,
    });
    expect(region).toHaveTextContent(/total balance/i);
    expect(region).toHaveTextContent(/1,234\.56|1\.234,56/);
    expect(region).toHaveTextContent(/month income/i);
    expect(region).toHaveTextContent(/3,200\.00|3\.200,00/);
    expect(region).toHaveTextContent(/month expenses/i);
    expect(region).toHaveTextContent(/950\.00|950,00/);
    expect(region).toHaveTextContent(/net/i);
    expect(region).toHaveTextContent(/2,250\.00|2\.250,00/);
  });

  it("renderiza charts consumindo dados brutos do backend", async () => {
    renderScreen(VIEW_POPULATED);

    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: /balance and cash flow/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("region", { name: /top categories/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/food/i)).toBeInTheDocument();
  });
});
