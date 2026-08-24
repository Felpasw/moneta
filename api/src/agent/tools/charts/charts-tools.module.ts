import { Module } from '@nestjs/common';

import { ChartsModule } from '../../../finance/charts/charts.module';
import { CreateVisualizationTool } from './create-visualization.tool';

@Module({
  imports: [ChartsModule],
  providers: [CreateVisualizationTool],
})
export class ChartsToolsModule {}
