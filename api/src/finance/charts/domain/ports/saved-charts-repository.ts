import type { ChartSpec } from '~/finance/charts/domain/schemas/chart-spec';

export const SAVED_CHARTS_REPOSITORY = Symbol('SAVED_CHARTS_REPOSITORY');

export interface SavedChart {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly spec: ChartSpec;
  readonly pinned: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SavedChartSummary {
  readonly id: string;
  readonly name: string;
  readonly spec: ChartSpec;
  readonly pinned: boolean;
  readonly updatedAt: Date;
}

export interface AddSavedChartInput {
  readonly userId: string;
  readonly name: string;
  readonly spec: ChartSpec;
}

export interface RenameSavedChartInput {
  readonly userId: string;
  readonly id: string;
  readonly name: string;
}

export interface SavedChartsRepository {
  add(input: AddSavedChartInput): Promise<SavedChart>;
  findById(params: {
    readonly userId: string;
    readonly id: string;
  }): Promise<SavedChart | null>;
  listSummaries(params: {
    readonly userId: string;
  }): Promise<SavedChartSummary[]>;
  rename(input: RenameSavedChartInput): Promise<SavedChart>;
  togglePin(params: {
    readonly userId: string;
    readonly id: string;
  }): Promise<SavedChart>;
  delete(params: {
    readonly userId: string;
    readonly id: string;
  }): Promise<void>;
}
