import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BankFilter } from "@/components/molecules/BankFilter";
import type { UserBankAccountWithBank } from "@/services/interfaces/accounts.interface";

vi.mock("@edusites/bancos-brasil", () => ({
  svgBanco: ({ nome }: { nome: string }) => Promise.resolve(`<svg data-slug="${nome}" />`),
}));

const makeAccount = (
  overrides: Partial<UserBankAccountWithBank>,
): UserBankAccountWithBank => ({
  id: overrides.id ?? "a1",
  userId: "u1",
  bankId: overrides.bankId ?? "b1",
  nickname: overrides.nickname ?? "Main",
  balance: 100,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
  bank: overrides.bank ?? { id: "b1", name: "Nubank", compeCode: "260", logoUrl: null },
  currentInvoice: null,
  usagePct: 0,
});

let client: QueryClient;

const wrap = (ui: ReactElement) => (
  <QueryClientProvider client={client}>{ui}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
});

describe("<BankFilter />", () => {
  it("renderiza um botão por conta com o nickname visível", () => {
    const accounts = [
      makeAccount({ id: "a1", nickname: "Salário" }),
      makeAccount({
        id: "a2",
        nickname: "Reserva",
        bank: { id: "b2", name: "Itau", compeCode: "341", logoUrl: null },
      }),
    ];
    render(wrap(<BankFilter accounts={accounts} selected={[]} onChange={vi.fn()} />));
    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getByText("Reserva")).toBeInTheDocument();
  });

  it("chama onChange adicionando o id quando clica em conta não selecionada", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const accounts = [makeAccount({ id: "a1", nickname: "Salário" })];
    render(wrap(<BankFilter accounts={accounts} selected={[]} onChange={onChange} />));
    await user.click(screen.getByText("Salário"));
    expect(onChange).toHaveBeenCalledWith(["a1"]);
  });

  it("chama onChange removendo o id quando clica em conta já selecionada", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const accounts = [
      makeAccount({ id: "a1", nickname: "Salário" }),
      makeAccount({ id: "a2", nickname: "Reserva" }),
    ];
    render(
      wrap(<BankFilter accounts={accounts} selected={["a1", "a2"]} onChange={onChange} />),
    );
    await user.click(screen.getByText("Salário"));
    expect(onChange).toHaveBeenCalledWith(["a2"]);
  });

  it("respeita maxVisible limitando avatares visíveis", () => {
    const accounts = Array.from({ length: 8 }).map((_, i) =>
      makeAccount({ id: `a${i}`, nickname: `Bank${i}` }),
    );
    render(
      wrap(
        <BankFilter accounts={accounts} selected={[]} onChange={vi.fn()} maxVisible={3} />,
      ),
    );
    expect(screen.getByText("Bank0")).toBeInTheDocument();
    expect(screen.getByText("Bank1")).toBeInTheDocument();
    expect(screen.getByText("Bank2")).toBeInTheDocument();
    expect(screen.queryByText("Bank3")).not.toBeInTheDocument();
  });

  it("abre dropdown de busca ao clicar em Add", async () => {
    const user = userEvent.setup();
    const accounts = [makeAccount({ id: "a1", nickname: "Salário" })];
    render(wrap(<BankFilter accounts={accounts} selected={[]} onChange={vi.fn()} />));
    await user.click(screen.getByText("Add"));
    expect(screen.getByPlaceholderText(/search banks/i)).toBeInTheDocument();
  });

  it("renderiza o label quando fornecido", () => {
    render(
      wrap(
        <BankFilter
          accounts={[]}
          selected={[]}
          onChange={vi.fn()}
          label="Filter by bank"
        />,
      ),
    );
    expect(screen.getByText(/filter by bank/i)).toBeInTheDocument();
  });
});
