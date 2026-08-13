import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { CreditAccountCard } from "@/components/molecules/CreditAccountCard";
import type { UserBankAccountWithBank } from "@/services/interfaces/accounts.interface";

const buildWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
  return Wrapper;
};

const BANK = {
  id: "bank-1",
  name: "Nubank",
  compeCode: "260",
  logoUrl: null,
};

const buildAccount = (
  overrides: Partial<UserBankAccountWithBank> = {},
): UserBankAccountWithBank => ({
  id: "acc-1",
  userId: "user-1",
  bankId: "bank-1",
  nickname: "Roxinho",
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 5,
  dueDay: 10,
  bank: BANK,
  currentInvoice: null,
  usagePct: 0,
  ...overrides,
});

describe("<CreditAccountCard />", () => {
  it("mostra o cash balance quando o cartão foi cadastrado com initialBalance > 0", () => {
    render(<CreditAccountCard account={buildAccount({ balance: 3030 })} />, {
      wrapper: buildWrapper(),
    });

    expect(screen.getByText(/cash balance/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?3,030\.00/)).toBeInTheDocument();
  });

  it("omite o cash balance quando o balance do cartão é 0", () => {
    render(<CreditAccountCard account={buildAccount({ balance: 0 })} />, {
      wrapper: buildWrapper(),
    });

    expect(screen.queryByText(/cash balance/i)).toBeNull();
  });

  it("aceita balance como string (formato serializado do Prisma Decimal) e mostra o valor", () => {
    render(
      <CreditAccountCard
        account={buildAccount({ balance: "1500.00" as unknown as number })}
      />,
      { wrapper: buildWrapper() },
    );

    expect(screen.getByText(/cash balance/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?1,500\.00/)).toBeInTheDocument();
  });

  it("continua renderizando credit limit como valor principal quando não há invoice", () => {
    render(<CreditAccountCard account={buildAccount({ balance: 3030 })} />, {
      wrapper: buildWrapper(),
    });

    expect(screen.getByText(/credit limit/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?5,000\.00/)).toBeInTheDocument();
  });
});
