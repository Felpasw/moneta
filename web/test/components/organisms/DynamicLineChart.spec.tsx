import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DynamicLineChart } from "@/components/organisms/DynamicLineChart";

const TEST_WIDTH = 600;

const points = [
  { x: "2026-06", y: 1500 },
  { x: "2026-07", y: 2100 },
  { x: "2026-08", y: 1800 },
];

describe("<DynamicLineChart />", () => {
  it("renders the line path from points", () => {
    render(
      <DynamicLineChart
        title="Monthly balance"
        width={TEST_WIDTH}
        points={points}
      />,
    );
    expect(screen.getByTestId("line-path")).toBeInTheDocument();
    expect(screen.queryByTestId("area-fill")).not.toBeInTheDocument();
  });

  it("renders the area fill when variant is area", () => {
    render(
      <DynamicLineChart
        title="Monthly balance"
        width={TEST_WIDTH}
        points={points}
        variant="area"
      />,
    );
    expect(screen.getByTestId("line-path")).toBeInTheDocument();
    expect(screen.getByTestId("area-fill")).toBeInTheDocument();
  });

  it("does not render the path when points is empty", () => {
    render(
      <DynamicLineChart title="Empty" width={TEST_WIDTH} points={[]} />,
    );
    expect(screen.queryByTestId("line-path")).not.toBeInTheDocument();
  });

  it("renders a visible marker when there is exactly one point", () => {
    const { container } = render(
      <DynamicLineChart
        title="Single"
        width={TEST_WIDTH}
        points={[{ x: "2026-06", y: 1500 }]}
      />,
    );
    const marker = container.querySelector("svg [data-testid='line-path']");
    expect(marker).not.toBeNull();
    expect(marker?.tagName.toLowerCase()).toBe("circle");
  });
});
