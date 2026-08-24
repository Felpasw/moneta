import { Module } from '@nestjs/common';

import { ChartQueryBuilder } from './application/services/chart-query-builder';

@Module({
  providers: [ChartQueryBuilder],
  exports: [ChartQueryBuilder],
})
export class ChartsModule {}
