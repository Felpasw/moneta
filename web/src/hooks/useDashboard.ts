/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `dashboardHooks.use()` acontece
 * durante o render em ordem estável, então Rules of Hooks (runtime) segue
 * respeitada. Regra: `use()` chama todos os hooks no topo em ordem fixa, sem
 * `if`/loop.
 */

import { useSuspenseQuery } from "@tanstack/react-query";

import dashboardService from "@/services/dashboard.service";
import type { DashboardView } from "@/services/interfaces/dashboard.interface";

import type {
  DashboardHooksResult,
  IDashboardHooks,
} from "./interfaces/useDashboard.interface";

export const DASHBOARD_QUERY_KEYS = {
  all: ["dashboard"] as const,
  view: ["dashboard", "view"] as const,
};

class DashboardHooks implements IDashboardHooks {
  use(): DashboardHooksResult {
    const view = useSuspenseQuery<DashboardView>({
      queryKey: DASHBOARD_QUERY_KEYS.view,
      queryFn: () => dashboardService.getView(),
    });

    return { view };
  }
}

const dashboardHooks = new DashboardHooks();

export default dashboardHooks;
