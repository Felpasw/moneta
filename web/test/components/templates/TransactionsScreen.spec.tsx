import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/transactions.service", () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock("@/services/accounts.service", () => ({
  default: {
    list: vi.fn(() =>
      Promise.resolve({
        items: [],
        summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
      }),
    ),
  },
}));

vi.mock("@edusites/bancos-brasil", () => ({
  svgBanco: ({ nome }: { nome: string }) => Promise.resolve(`<svg data-slug="${nome}" />`),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/transactions",
  useSearchParams: () => new URLSearchParams(),
}));

import { TransactionsScreen } from "@/components/templates/TransactionsScreen";
import transactionsService from "@/services/transactions.service";
import type {
  ListTransactionsResult,
  TransactionWithEmbeds,
} from "@/services/interfaces/transactions.interface";

const mockedService = vi.mocked(transactionsService);

const groceriesToday: TransactionWithEmbeds = {
  id: "t-1",
  userId: "u-1",
  accountId: "acc-1",
  categoryId: "cat-1",
  invoiceId: null,
  type: "expense",
  amount: 120.5,
  description: "Weekly groceries",
  occurredAt: "2026-08-07T10:00:00.000Z",
  account: { id: "acc-1", nickname: "Main", bankName: "Nubank" },
  category: { id: "cat-1", name: "Groceries", icon: "🛒", color: "#22c55e" },
  signedAmount: -120.5,
  dayGroupKey: "2026-08-07",
};

const payrollYesterday: TransactionWithEmbeds = {
  id: "t-2",
  userId: "u-1",
  accountId: "acc-1",
  categoryId: null,
  invoiceId: null,
  type: "income",
  amount: 2000,
  description: "Payroll",
  occurredAt: "2026-08-06T09:00:00.000Z",
  account: { id: "acc-1", nickname: "Main", bankName: "Nubank" },
  category: null,
  signedAmount: 2000,
  dayGroupKey: "2026-08-06",
};

const POPULATED: ListTransactionsResult = {
  items: [groceriesToday, payrollYesterday],
  summary: { totalIncome: 2000, totalExpense: 120.5, net: 1879.5 },
};

const EMPTY: ListTransactionsResult = {
  items: [],
  summary: { totalIncome: 0, totalExpense: 0, net: 0 },
};

const renderScreen = (data: ListTransactionsResult) => {
  mockedService.list.mockResolvedValueOnce(data);
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
      <TransactionsScreen />
    </Wrapper>,
  );
};

describe("<TransactionsScreen />", () => {
  it("mostra EmptyState quando não há transações", async () => {
    renderScreen(EMPTY);

    await waitFor(() =>
      expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("region", { name: /period summary/i }),
    ).toBeNull();
  });

  it("renderiza cada transação com descrição, categoria e account", async () => {
    renderScreen(POPULATED);

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );
    expect(screen.getByText("Payroll")).toBeInTheDocument();
    expect(screen.getByText(/groceries.*main/i)).toBeInTheDocument();
    expect(screen.getByText(/uncategorized.*main/i)).toBeInTheDocument();
  });

  it("renderiza o BankIcon (aria-label do banco) ao lado do ícone de direção de cada transação", async () => {
    renderScreen(POPULATED);

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    // Duas transações do Nubank ⇒ 2 ícones do banco identificados por aria-label
    const bankIcons = screen.getAllByRole("img", { name: /nubank/i });
    expect(bankIcons.length).toBeGreaterThanOrEqual(2);
  });

  it("renderiza summary vindo direto do backend (sem soma no cliente)", async () => {
    renderScreen(POPULATED);

    const region = await screen.findByRole("region", {
      name: /period summary/i,
    });
    expect(region).toHaveTextContent(/income/i);
    expect(region).toHaveTextContent(/expenses/i);
    expect(region).toHaveTextContent(/net/i);
    expect(region).toHaveTextContent(/2,000\.00|2\.000,00/);
    expect(region).toHaveTextContent(/120\.50|120,50/);
  });
});
