import { create } from "zustand";

import type {
  ChartData,
  ChartSpec,
} from "@/services/interfaces/chart.interface";
import { ChartType } from "@/services/interfaces/chart.interface";

interface ChartTakeoverState {
  open: boolean;
  spec: ChartSpec | null;
  data: ChartData | null;
  selectedType: ChartType | null;
}

const INITIAL_STATE: ChartTakeoverState = {
  open: false,
  spec: null,
  data: null,
  selectedType: null,
};

export const useChartTakeoverStore = create<ChartTakeoverState>(
  () => INITIAL_STATE,
);

interface OpenChartInput {
  readonly spec: ChartSpec;
  readonly data: ChartData;
}

export const chartTakeoverActions = {
  open: (input: OpenChartInput) =>
    useChartTakeoverStore.setState({
      open: true,
      spec: input.spec,
      data: input.data,
      selectedType: null,
    }),
  close: () => useChartTakeoverStore.setState(INITIAL_STATE),
  setSelectedType: (type: ChartType) =>
    useChartTakeoverStore.setState({ selectedType: type }),
};
