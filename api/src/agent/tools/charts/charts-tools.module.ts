import { Module } from '@nestjs/common';

import { ChartsModule } from '../../../finance/charts/charts.module';
import { CreateVisualizationTool } from './create-visualization.tool';
import { DeleteSavedChartTool } from './delete-saved-chart.tool';
import { ListSavedChartsTool } from './list-saved-charts.tool';
import { RenameSavedChartTool } from './rename-saved-chart.tool';
import { RunSavedChartTool } from './run-saved-chart.tool';
import { SaveChartTool } from './save-chart.tool';
import { TogglePinSavedChartTool } from './toggle-pin-saved-chart.tool';

@Module({
  imports: [ChartsModule],
  providers: [
    CreateVisualizationTool,
    SaveChartTool,
    ListSavedChartsTool,
    RunSavedChartTool,
    RenameSavedChartTool,
    DeleteSavedChartTool,
    TogglePinSavedChartTool,
  ],
})
export class ChartsToolsModule {}
