import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TransactionTypeFilter } from "@/components/molecules/TransactionTypeFilter";

describe("<TransactionTypeFilter />", () => {
  it("renderiza os 3 chips (All / Income / Expense)", () => {
    render(<TransactionTypeFilter value="all" onChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /income/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /expense/i })).toBeInTheDocument();
  });

  it("marca o chip 'All' como checked quando value=all", () => {
    render(<TransactionTypeFilter value="all" onChange={vi.fn()} />);
    expect(screen.getByRole("radio", { name: /all/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /income/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("chama onChange('income') ao clicar em Income", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TransactionTypeFilter value="all" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: /income/i }));
    expect(onChange).toHaveBeenCalledWith("income");
  });

  it("chama onChange('expense') ao clicar em Expense", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TransactionTypeFilter value="all" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: /expense/i }));
    expect(onChange).toHaveBeenCalledWith("expense");
  });

  it("renderiza label quando fornecido", () => {
    render(
      <TransactionTypeFilter
        value="all"
        onChange={vi.fn()}
        label="Filter by type"
      />,
    );
    expect(screen.getByText(/filter by type/i)).toBeInTheDocument();
  });
});
