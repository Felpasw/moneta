import { beforeEach, describe, expect, it } from "vitest";

import {
  ChartType,
  XField,
  YField,
  Aggregation,
  Grouping,
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

describe("chartTakeoverStore", () => {
  beforeEach(() => {
    chartTakeoverActions.close();
  });

  it("starts closed with no spec/data", () => {
    const state = useChartTakeoverStore.getState();
    expect(state.open).toBe(false);
    expect(state.spec).toBeNull();
    expect(state.data).toBeNull();
  });

  it("openChart sets open=true and stores spec + data", () => {
    chartTakeoverActions.open({ spec, data });
    const state = useChartTakeoverStore.getState();
    expect(state.open).toBe(true);
    expect(state.spec).toEqual(spec);
    expect(state.data).toEqual(data);
  });

  it("close resets to the initial state", () => {
    chartTakeoverActions.open({ spec, data });
    chartTakeoverActions.close();
    const state = useChartTakeoverStore.getState();
    expect(state.open).toBe(false);
    expect(state.spec).toBeNull();
    expect(state.data).toBeNull();
  });
});
