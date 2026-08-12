import api from "@/api";

import type {
  DashboardView,
  IDashboardService,
} from "./interfaces/dashboard.interface";

class DashboardService implements IDashboardService {
  async getView(): Promise<DashboardView> {
    const { data } = await api.get<DashboardView>("/dashboard/view");
    return data;
  }
}

const dashboardService = new DashboardService();

export default dashboardService;
