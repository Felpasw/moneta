import type { UseSuspenseQueryResult } from "@tanstack/react-query";

import type { DashboardView } from "@/services/interfaces/dashboard.interface";

export interface DashboardHooksResult {
  view: UseSuspenseQueryResult<DashboardView>;
}

export interface IDashboardHooks {
  use(): DashboardHooksResult;
}
