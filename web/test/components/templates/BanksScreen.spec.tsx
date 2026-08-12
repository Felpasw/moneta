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

import { BanksScreen } from "@/components/templates/BanksScreen";
import accountsService from "@/services/accounts.service";
import type {
  ListAccountsResult,
  UserBankAccountWithBank,
} from "@/services/interfaces/accounts.interface";

const mockedService = vi.mocked(accountsService);

const bank = { id: "b-1", name: "Nubank", compeCode: "260", logoUrl: null };

const CHECKING: UserBankAccountWithBank = {
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
};

const CREDIT: UserBankAccountWithBank = {
  id: "acc-2",
  userId: "u-1",
  bankId: "b-2",
  nickname: "Roxinho",
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 5,
  dueDay: 12,
  bank: { ...bank, id: "b-2", name: "Nubank Cartão" },
  currentInvoice: null,
  usagePct: 0,
};

const POPULATED: ListAccountsResult = {
  items: [CHECKING, CREDIT],
  summary: {
    totalBalance: 1234.56,
    checkingCount: 1,
    totalOverdraft: 500,
  },
};

const EMPTY: ListAccountsResult = {
  items: [],
  summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
};

const renderScreen = (data: ListAccountsResult) => {
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
      <BanksScreen />
    </Wrapper>,
  );
};

describe("<BanksScreen />", () => {
  it("mostra EmptyState quando items é uma lista vazia", async () => {
    renderScreen(EMPTY);

    await waitFor(() =>
      expect(screen.getByText(/no bank accounts yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("region", { name: /checking total/i }),
    ).toBeNull();
  });

  it("renderiza checking + credit cards lendo bank.name direto do account", async () => {
    renderScreen(POPULATED);

    await waitFor(() =>
      expect(screen.getByText("Main")).toBeInTheDocument(),
    );
    expect(screen.getByText("Roxinho")).toBeInTheDocument();
    expect(screen.getAllByText("Nubank").length).toBeGreaterThan(0);
    expect(screen.getByText("Nubank Cartão")).toBeInTheDocument();
  });

  it("mostra summary vindo direto do backend (sem soma no cliente)", async () => {
    renderScreen(POPULATED);

    const summary = await screen.findByRole("region", {
      name: /checking total/i,
    });
    expect(summary).toHaveTextContent(/1 checking accounts/i);
    expect(summary).toHaveTextContent(/1,234\.56|1\.234,56|R\$/);
  });

  it("renderiza a invoice section do CreditAccountCard quando currentInvoice existe", async () => {
    const CREDIT_WITH_INVOICE: UserBankAccountWithBank = {
      ...CREDIT,
      currentInvoice: {
        totalAmount: 2500,
        status: "open",
        dueDate: "2026-09-12",
        cycleStart: "2026-08-05",
        cycleEnd: "2026-09-04",
        available: 2500,
      },
      usagePct: 50,
    };

    renderScreen({
      items: [CREDIT_WITH_INVOICE],
      summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
    });

    await waitFor(() =>
      expect(screen.getByText(/current statement/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/limit usage/i)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/^open$/i)).toBeInTheDocument();
  });
});
