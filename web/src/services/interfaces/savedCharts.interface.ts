import type {
  ChartData,
  ChartDataMeta,
  ChartSpec,
} from "@/services/interfaces/chart.interface";

export interface SavedChartSummary {
  id: string;
  name: string;
  spec: ChartSpec;
  pinned: boolean;
  updatedAt: string;
}

export interface SavedChartsView {
  items: SavedChartSummary[];
}

export interface RunSavedChartResponse {
  spec: ChartSpec;
  data: ChartData;
  meta: ChartDataMeta;
}

export interface ISavedChartsService {
  list(): Promise<SavedChartsView>;
  run(id: string): Promise<RunSavedChartResponse>;
  rename(id: string, name: string): Promise<void>;
  togglePin(id: string): Promise<{ id: string; pinned: boolean }>;
  delete(id: string): Promise<void>;
}
