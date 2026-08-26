import type {
  UseMutationResult,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";

import type {
  RunSavedChartResponse,
  SavedChartsView,
} from "@/services/interfaces/savedCharts.interface";

export interface SavedChartsHooksResult {
  view: UseSuspenseQueryResult<SavedChartsView>;
  run: UseMutationResult<RunSavedChartResponse, Error, string>;
  rename: UseMutationResult<void, Error, { id: string; name: string }>;
  togglePin: UseMutationResult<
    { id: string; pinned: boolean },
    Error,
    string
  >;
  remove: UseMutationResult<void, Error, string>;
}

export interface ISavedChartsHooks {
  use(): SavedChartsHooksResult;
}
