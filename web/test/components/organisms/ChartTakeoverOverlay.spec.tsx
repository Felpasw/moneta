import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/organisms/DynamicChart", () => ({
  DynamicChart: ({ spec }: { spec: { title: string } }) => (
    <div data-testid="dynamic-chart">{spec.title}</div>
  ),
}));

import { ChartTakeoverOverlay } from "@/components/organisms/ChartTakeoverOverlay";
import {
  Aggregation,
  ChartType,
  Grouping,
  XField,
  YField,
  type ChartData,
  type ChartSpec,
} from "@/services/interfaces/chart.interface";
import {
  chartTakeoverActions,
  useChartTakeoverStore,
} from "@/stores/chartTakeoverStore";

const spec: ChartSpec = {
  chartType: ChartType.Bar,
  xAxis: { field: XField.Category, grouping: Grouping.Category },
  yAxis: { field: YField.Amount, aggregation: Aggregation.Sum },
  filters: {},
  title: "Spending by category",
};

const data: ChartData = {
  points: [{ x: "Food", y: 100 }],
  meta: { totalRows: 1 },
};

const resetStore = () => {
  act(() => {
    chartTakeoverActions.close();
  });
};

describe("<ChartTakeoverOverlay />", () => {
  afterEach(() => {
    resetStore();
  });

  it("renders nothing while the store is closed", () => {
    render(<ChartTakeoverOverlay />);
    expect(useChartTakeoverStore.getState().open).toBe(false);
    expect(screen.queryByTestId("dynamic-chart")).not.toBeInTheDocument();
  });

  it("renders the DynamicChart when the store is open", () => {
    render(<ChartTakeoverOverlay />);
    act(() => {
      chartTakeoverActions.open({ spec, data });
    });
    expect(screen.getByTestId("dynamic-chart")).toHaveTextContent(
      "Spending by category",
    );
  });

  it("closes when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChartTakeoverOverlay />);
    act(() => {
      chartTakeoverActions.open({ spec, data });
    });

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(useChartTakeoverStore.getState().open).toBe(false);
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<ChartTakeoverOverlay />);
    act(() => {
      chartTakeoverActions.open({ spec, data });
    });

    await user.click(screen.getByTestId("chart-backdrop"));

    expect(useChartTakeoverStore.getState().open).toBe(false);
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<ChartTakeoverOverlay />);
    act(() => {
      chartTakeoverActions.open({ spec, data });
    });

    await user.keyboard("{Escape}");

    expect(useChartTakeoverStore.getState().open).toBe(false);
  });
});
