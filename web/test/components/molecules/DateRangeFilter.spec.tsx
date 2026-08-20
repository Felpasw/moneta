import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateRangeFilter } from "@/components/molecules/DateRangeFilter";

describe("<DateRangeFilter />", () => {
  it("mostra 'All time' quando não há range selecionado", () => {
    render(<DateRangeFilter value={{ from: null, to: null }} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /all time/i })).toBeInTheDocument();
  });

  it("formata o range selecionado no trigger", () => {
    const from = new Date(2026, 7, 1);
    const to = new Date(2026, 7, 31);
    render(<DateRangeFilter value={{ from, to }} onChange={vi.fn()} />);
    const label = screen.getByText(/\d{2}.*2026.*→.*\d{2}.*2026/i);
    expect(label).toBeInTheDocument();
  });

  it("abre o popover ao clicar no trigger", async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={{ from: null, to: null }} onChange={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /all time/i }));
    expect(screen.getByRole("dialog", { name: /choose date range/i })).toBeInTheDocument();
  });

  it("dispara onChange com o range do preset 'This month'", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateRangeFilter value={{ from: null, to: null }} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /all time/i }));
    await user.click(screen.getByRole("button", { name: /this month/i }));
    expect(onChange).toHaveBeenCalledOnce();
    const call = onChange.mock.calls[0][0];
    expect(call.from).toBeInstanceOf(Date);
    expect(call.to).toBeInstanceOf(Date);
    expect(call.from.getDate()).toBe(1);
  });

  it("dispara onChange com from/to null ao clicar em Clear no trigger", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const from = new Date(2026, 7, 1);
    const to = new Date(2026, 7, 31);
    render(<DateRangeFilter value={{ from, to }} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /clear date range/i }));
    expect(onChange).toHaveBeenCalledWith({ from: null, to: null });
  });

  it("renderiza label quando fornecido", () => {
    render(
      <DateRangeFilter
        value={{ from: null, to: null }}
        onChange={vi.fn()}
        label="Filter by period"
      />,
    );
    expect(screen.getByText(/filter by period/i)).toBeInTheDocument();
  });
});
