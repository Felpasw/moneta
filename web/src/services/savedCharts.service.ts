import api from "@/api";

import type {
  ISavedChartsService,
  RunSavedChartResponse,
  SavedChartsView,
} from "./interfaces/savedCharts.interface";

class SavedChartsService implements ISavedChartsService {
  async list(): Promise<SavedChartsView> {
    const { data } = await api.get<SavedChartsView>("/saved-charts");
    return data;
  }

  async run(id: string): Promise<RunSavedChartResponse> {
    const { data } = await api.post<RunSavedChartResponse>(
      `/saved-charts/${id}/run`,
    );
    return data;
  }

  async rename(id: string, name: string): Promise<void> {
    await api.patch(`/saved-charts/${id}/name`, { name });
  }

  async togglePin(id: string): Promise<{ id: string; pinned: boolean }> {
    const { data } = await api.patch<{ id: string; pinned: boolean }>(
      `/saved-charts/${id}/pin`,
    );
    return data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/saved-charts/${id}`);
  }
}

const savedChartsService = new SavedChartsService();

export default savedChartsService;
