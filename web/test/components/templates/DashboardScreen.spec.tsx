import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/accounts.service", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    setBalance: vi.fn(),
  },
}));

vi.mock("@/services/transactions.service", () => ({
  default: {
    list: vi.fn(),
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
import accountsService from "@/services/accounts.service";
import transactionsService from "@/services/transactions.service";
import type { ListAccountsResult } from "@/services/interfaces/accounts.interface";
import type { ListTransactionsResult } from "@/services/interfaces/transactions.interface";

const mockedAccounts = vi.mocked(accountsService);
const mockedTransactions = vi.mocked(transactionsService);

const bank = { id: "b-1", name: "Nubank", compeCode: "260", logoUrl: null };

const ACCOUNTS_POPULATED: ListAccountsResult = {
  items: [
    {
      id: "acc-1",
      userId: "u-1",
      bankId: "b-1",
      nickname: "Main",
      balance: 1234.56,
      creditLimit: null,
      overdraftLimit: 500,
      closeDay: null,
      dueDay: null,
      bank,
      currentInvoice: null,
      usagePct: 0,
    },
  ],
  summary: { totalBalance: 1234.56, checkingCount: 1, totalOverdraft: 500 },
};

const ACCOUNTS_EMPTY: ListAccountsResult = {
  items: [],
  summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
};

const TRANSACTIONS_POPULATED: ListTransactionsResult = {
  items: [],
  summary: { totalIncome: 3200, totalExpense: 950, net: 2250 },
};

const TRANSACTIONS_EMPTY: ListTransactionsResult = {
  items: [],
  summary: { totalIncome: 0, totalExpense: 0, net: 0 },
};

const renderScreen = (
  accountsData: ListAccountsResult,
  transactionsData: ListTransactionsResult,
) => {
  mockedAccounts.list.mockResolvedValueOnce(accountsData);
  mockedTransactions.list.mockResolvedValueOnce(transactionsData);
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
  it("mostra EmptyState quando o user não tem contas", async () => {
    renderScreen(ACCOUNTS_EMPTY, TRANSACTIONS_EMPTY);

    await waitFor(() =>
      expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("region", { name: /key indicators/i }),
    ).toBeNull();
  });

  it("renderiza saudação com nome do user", async () => {
    renderScreen(ACCOUNTS_POPULATED, TRANSACTIONS_POPULATED);

    await waitFor(() =>
      expect(screen.getByText(/hi, felipe/i)).toBeInTheDocument(),
    );
  });

  it("renderiza KPI Total balance vindo direto do accounts.summary", async () => {
    renderScreen(ACCOUNTS_POPULATED, TRANSACTIONS_POPULATED);

    const region = await screen.findByRole("region", {
      name: /key indicators/i,
    });
    expect(region).toHaveTextContent(/total balance/i);
    expect(region).toHaveTextContent(/1,234\.56|1\.234,56/);
  });

  it("renderiza KPIs de income/expense/net vindo direto do transactions.summary", async () => {
    renderScreen(ACCOUNTS_POPULATED, TRANSACTIONS_POPULATED);

    const region = await screen.findByRole("region", {
      name: /key indicators/i,
    });
    expect(region).toHaveTextContent(/recent income/i);
    expect(region).toHaveTextContent(/3,200\.00|3\.200,00/);
    expect(region).toHaveTextContent(/recent expenses/i);
    expect(region).toHaveTextContent(/950\.00|950,00/);
    expect(region).toHaveTextContent(/net/i);
    expect(region).toHaveTextContent(/2,250\.00|2\.250,00/);
  });
});
