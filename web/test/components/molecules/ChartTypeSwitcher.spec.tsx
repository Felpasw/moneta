import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChartTypeSwitcher } from "@/components/molecules/ChartTypeSwitcher";
import { ChartType } from "@/services/interfaces/chart.interface";

describe("<ChartTypeSwitcher />", () => {
  it("marks the selected type as active", () => {
    render(
      <ChartTypeSwitcher selected={ChartType.Bar} onSelect={() => undefined} />,
    );
    const bar = screen.getByRole("tab", { name: /bar/i });
    expect(bar).toHaveAttribute("aria-selected", "true");
    expect(bar.dataset.active).toBe("true");
  });

  it("calls onSelect with the clicked type", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ChartTypeSwitcher selected={ChartType.Bar} onSelect={onSelect} />,
    );

    await user.click(screen.getByRole("tab", { name: /line/i }));

    expect(onSelect).toHaveBeenCalledWith(ChartType.Line);
  });

  it("renders one tab per supported chart type", () => {
    render(
      <ChartTypeSwitcher selected={ChartType.Bar} onSelect={() => undefined} />,
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
  });
});
