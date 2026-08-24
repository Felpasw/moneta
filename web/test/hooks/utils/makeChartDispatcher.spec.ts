import { describe, expect, it, vi } from "vitest";

import { AgentSocketEvent } from "@/hooks/constants/useAgentSession.constants";
import { makeChartDispatcher } from "@/hooks/utils/useAgentSession.utils";
import {
  ChartType,
  XField,
  YField,
  Aggregation,
  Grouping,
  type ChartData,
  type ChartSpec,
} from "@/services/interfaces/chart.interface";

const spec: ChartSpec = {
  chartType: ChartType.Bar,
  xAxis: { field: XField.Category, grouping: Grouping.Category },
  yAxis: { field: YField.Amount, aggregation: Aggregation.Sum },
  filters: {},
  title: "Test",
};

const data: ChartData = {
  points: [{ x: "A", y: 1 }],
  meta: { totalRows: 1 },
};

describe("makeChartDispatcher", () => {
  it("invokes onOpenChart with spec+data when the envelope is chart.open", () => {
    const onOpenChart = vi.fn();
    const dispatch = makeChartDispatcher({ onOpenChart });

    dispatch(
      JSON.stringify({
        type: AgentSocketEvent.ChartOpen,
        spec,
        data,
        meta: data.meta,
      }),
    );

    expect(onOpenChart).toHaveBeenCalledWith({ spec, data });
  });

  it("ignores envelopes with a different type", () => {
    const onOpenChart = vi.fn();
    const dispatch = makeChartDispatcher({ onOpenChart });

    dispatch(JSON.stringify({ type: "tool.result", callId: "x", result: {} }));

    expect(onOpenChart).not.toHaveBeenCalled();
  });

  it("ignores non-string payloads", () => {
    const onOpenChart = vi.fn();
    const dispatch = makeChartDispatcher({ onOpenChart });

    dispatch(new ArrayBuffer(0));

    expect(onOpenChart).not.toHaveBeenCalled();
  });

  it("ignores malformed JSON", () => {
    const onOpenChart = vi.fn();
    const dispatch = makeChartDispatcher({ onOpenChart });

    dispatch("not-json-{{{");

    expect(onOpenChart).not.toHaveBeenCalled();
  });

});
