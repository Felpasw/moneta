import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChartType,
  XField,
  YField,
  Aggregation,
  Grouping,
  type ChartSpec,
} from "@/services/interfaces/chart.interface";

const spec: ChartSpec = {
  chartType: ChartType.Bar,
  xAxis: { field: XField.Category, grouping: Grouping.Category },
  yAxis: { field: YField.Amount, aggregation: Aggregation.Sum },
  filters: {},
  title: "Spending by category",
};

const mocks = vi.hoisted(() => ({
  runMutate: vi.fn(),
  togglePinMutate: vi.fn(),
  renameMutate: vi.fn(),
  removeMutate: vi.fn(),
  openTakeover: vi.fn(),
  hooksResult: {
    view: { data: { items: [] as unknown[] } },
    run: { mutate: vi.fn() },
    togglePin: { mutate: vi.fn() },
    rename: { mutate: vi.fn() },
    remove: { mutate: vi.fn() },
  },
}));

vi.mock("@/hooks/useSavedCharts", () => ({
  default: { use: () => mocks.hooksResult },
}));

vi.mock("@/stores/chartTakeoverStore", () => ({
  chartTakeoverActions: { open: mocks.openTakeover },
}));

import { SavedChartsScreen } from "@/components/templates/SavedChartsScreen";

const buildHooks = (items: unknown[]) => {
  mocks.runMutate.mockReset();
  mocks.togglePinMutate.mockReset();
  mocks.renameMutate.mockReset();
  mocks.removeMutate.mockReset();
  mocks.openTakeover.mockReset();
  mocks.hooksResult.view.data.items = items;
  mocks.hooksResult.run.mutate = mocks.runMutate;
  mocks.hooksResult.togglePin.mutate = mocks.togglePinMutate;
  mocks.hooksResult.rename.mutate = mocks.renameMutate;
  mocks.hooksResult.remove.mutate = mocks.removeMutate;
};

describe("<SavedChartsScreen />", () => {
  beforeEach(() => {
    buildHooks([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the empty state when there are no saved charts", () => {
    render(<SavedChartsScreen />);
    expect(screen.getByText(/no saved charts yet/i)).toBeInTheDocument();
  });

  it("renders one card per saved chart", () => {
    buildHooks([
      {
        id: "a",
        name: "Monthly spending",
        spec,
        pinned: false,
        updatedAt: "2026-06-01",
      },
      {
        id: "b",
        name: "Bank breakdown",
        spec,
        pinned: true,
        updatedAt: "2026-06-02",
      },
    ]);

    render(<SavedChartsScreen />);

    expect(screen.getByText("Monthly spending")).toBeInTheDocument();
    expect(screen.getByText("Bank breakdown")).toBeInTheDocument();
  });

  it("clicking a card runs the chart and opens the takeover overlay on success", async () => {
    const user = userEvent.setup();
    buildHooks([
      {
        id: "a",
        name: "Monthly",
        spec,
        pinned: false,
        updatedAt: "2026-06-01",
      },
    ]);
    const runData = { points: [{ x: "Food", y: 100 }], meta: { totalRows: 1 } };
    mocks.runMutate.mockImplementation(
      (
        _id: string,
        opts: {
          onSuccess: (r: {
            spec: typeof spec;
            data: typeof runData;
            meta: typeof runData.meta;
          }) => void;
        },
      ) => {
        opts.onSuccess({ spec, data: runData, meta: runData.meta });
      },
    );

    render(<SavedChartsScreen />);
    await user.click(screen.getByRole("button", { name: /monthly/i }));

    expect(mocks.runMutate).toHaveBeenCalledWith("a", expect.any(Object));
    expect(mocks.openTakeover).toHaveBeenCalledWith({ spec, data: runData });
  });
});
