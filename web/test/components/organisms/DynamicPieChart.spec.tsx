import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DynamicPieChart } from "@/components/organisms/DynamicPieChart";

const points = [
  { x: "Food", y: 600 },
  { x: "Transport", y: 300 },
  { x: "Leisure", y: 100 },
];

describe("<DynamicPieChart />", () => {
  it("renders one slice per point", () => {
    render(<DynamicPieChart title="By category" points={points} />);
    expect(screen.getAllByTestId("slice")).toHaveLength(3);
  });

  it("renders a legend row per point with the label", () => {
    render(<DynamicPieChart title="By category" points={points} />);
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Leisure")).toBeInTheDocument();
  });

  it("renders zero slices when the total is zero", () => {
    render(
      <DynamicPieChart
        title="Empty"
        points={[
          { x: "A", y: 0 },
          { x: "B", y: 0 },
        ]}
      />,
    );
    expect(screen.queryAllByTestId("slice")).toHaveLength(0);
  });
});
