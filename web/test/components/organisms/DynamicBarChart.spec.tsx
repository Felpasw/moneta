import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DynamicBarChart } from "@/components/organisms/DynamicBarChart";

describe("<DynamicBarChart />", () => {
  it("renders one bar per point with the value as data-value", () => {
    render(
      <DynamicBarChart
        title="Spending by category"
        points={[
          { x: "Food", y: 1200 },
          { x: "Transport", y: 800 },
        ]}
      />,
    );

    const bars = screen.getAllByTestId("bar");
    expect(bars).toHaveLength(2);
    expect(bars[0].dataset.value).toBe("1200");
    expect(bars[1].dataset.value).toBe("800");
  });

  it("shows x labels and the chart title", () => {
    render(
      <DynamicBarChart
        title="Spending by category"
        points={[
          { x: "Food", y: 100 },
          { x: "Fuel", y: 50 },
        ]}
      />,
    );

    expect(screen.getByText("Spending by category")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Fuel")).toBeInTheDocument();
  });

  it("does not blow up when points is empty", () => {
    render(<DynamicBarChart title="Empty" points={[]} />);
    expect(screen.queryAllByTestId("bar")).toHaveLength(0);
  });
});
