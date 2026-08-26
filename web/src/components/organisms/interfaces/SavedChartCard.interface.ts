import type { SavedChartSummary } from "@/services/interfaces/savedCharts.interface";

export interface SavedChartCardProps {
  chart: SavedChartSummary;
  onOpen: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}
