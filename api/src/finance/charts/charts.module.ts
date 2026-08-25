import { Module } from '@nestjs/common';

import { ChartQueryBuilder } from './application/services/chart-query-builder';
import { SAVED_CHARTS_REPOSITORY } from './domain/ports/saved-charts-repository';
import { PrismaSavedChartsRepository } from './infrastructure/repositories/prisma-saved-charts.repository';

@Module({
  providers: [
    ChartQueryBuilder,
    {
      provide: SAVED_CHARTS_REPOSITORY,
      useClass: PrismaSavedChartsRepository,
    },
  ],
  exports: [ChartQueryBuilder, SAVED_CHARTS_REPOSITORY],
})
export class ChartsModule {}
