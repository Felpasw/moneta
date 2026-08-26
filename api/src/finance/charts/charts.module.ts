import { Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';

import { ChartQueryBuilder } from './application/services/chart-query-builder';
import { SAVED_CHARTS_REPOSITORY } from './domain/ports/saved-charts-repository';
import { PrismaSavedChartsRepository } from './infrastructure/repositories/prisma-saved-charts.repository';
import { SavedChartsController } from './saved-charts.controller';

@Module({
  imports: [AuthModule],
  controllers: [SavedChartsController],
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
