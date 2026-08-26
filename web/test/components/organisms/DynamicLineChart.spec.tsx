import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DynamicLineChart } from "@/components/organisms/DynamicLineChart";

const points = [
  { x: "2026-06", y: 1500 },
  { x: "2026-07", y: 2100 },
  { x: "2026-08", y: 1800 },
];

describe("<DynamicLineChart />", () => {
  it("renders the line path from points", () => {
    render(<DynamicLineChart title="Monthly balance" points={points} />);
    expect(screen.getByTestId("line-path")).toBeInTheDocument();
    expect(screen.queryByTestId("area-fill")).not.toBeInTheDocument();
  });

  it("renders the area fill when variant is area", () => {
    render(
      <DynamicLineChart
        title="Monthly balance"
        points={points}
        variant="area"
      />,
    );
    expect(screen.getByTestId("line-path")).toBeInTheDocument();
    expect(screen.getByTestId("area-fill")).toBeInTheDocument();
  });

  it("does not render the path when points is empty", () => {
    render(<DynamicLineChart title="Empty" points={[]} />);
    expect(screen.queryByTestId("line-path")).not.toBeInTheDocument();
  });
});
