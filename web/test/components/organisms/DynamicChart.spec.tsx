import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/organisms/DynamicBarChart", () => ({
  DynamicBarChart: ({ title }: { title: string }) => (
    <div data-testid="bar-chart">{title}</div>
  ),
}));
vi.mock("@/components/organisms/DynamicLineChart", () => ({
  DynamicLineChart: ({
    title,
    variant,
  }: {
    title: string;
    variant?: string;
  }) => (
    <div data-testid="line-chart" data-variant={variant}>
      {title}
    </div>
  ),
}));
vi.mock("@/components/organisms/DynamicPieChart", () => ({
  DynamicPieChart: ({
    title,
    variant,
  }: {
    title: string;
    variant?: string;
  }) => (
    <div data-testid="pie-chart" data-variant={variant}>
      {title}
    </div>
  ),
}));

import { DynamicChart } from "@/components/organisms/DynamicChart";
import {
  Aggregation,
  ChartType,
  Grouping,
  XField,
  YField,
  type ChartData,
  type ChartSpec,
} from "@/services/interfaces/chart.interface";

const buildSpec = (chartType: ChartType, title = "Chart"): ChartSpec => ({
  chartType,
  xAxis: { field: XField.Category, grouping: Grouping.Category },
  yAxis: { field: YField.Amount, aggregation: Aggregation.Sum },
  filters: {},
  title,
});

const data: ChartData = {
  points: [
    { x: "Food", y: 1200 },
    { x: "Transport", y: 800 },
  ],
  meta: { totalRows: 2 },
};

describe("<DynamicChart />", () => {
  it("delegates bar to DynamicBarChart", () => {
    render(<DynamicChart spec={buildSpec(ChartType.Bar)} data={data} />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("delegates stacked-bar to DynamicBarChart (V1 degrades to bar)", () => {
    render(<DynamicChart spec={buildSpec(ChartType.StackedBar)} data={data} />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("delegates line to DynamicLineChart with variant=line", () => {
    render(<DynamicChart spec={buildSpec(ChartType.Line)} data={data} />);
    const line = screen.getByTestId("line-chart");
    expect(line).toBeInTheDocument();
    expect(line.dataset.variant).toBe("line");
  });

  it("delegates area to DynamicLineChart with variant=area", () => {
    render(<DynamicChart spec={buildSpec(ChartType.Area)} data={data} />);
    const line = screen.getByTestId("line-chart");
    expect(line.dataset.variant).toBe("area");
  });

  it("delegates pie to DynamicPieChart with variant=pie", () => {
    render(<DynamicChart spec={buildSpec(ChartType.Pie)} data={data} />);
    const pie = screen.getByTestId("pie-chart");
    expect(pie.dataset.variant).toBe("pie");
  });

  it("delegates donut to DynamicPieChart with variant=donut", () => {
    render(<DynamicChart spec={buildSpec(ChartType.Donut)} data={data} />);
    const pie = screen.getByTestId("pie-chart");
    expect(pie.dataset.variant).toBe("donut");
  });

  it("shows a fallback for scatter (not supported in V1)", () => {
    render(<DynamicChart spec={buildSpec(ChartType.Scatter)} data={data} />);
    expect(screen.getByRole("status")).toHaveTextContent(/not supported/i);
  });

  it("shows a fallback for heatmap (not supported in V1)", () => {
    render(<DynamicChart spec={buildSpec(ChartType.Heatmap)} data={data} />);
    expect(screen.getByRole("status")).toHaveTextContent(/not supported/i);
  });
});
