import type { ChartSpec as DomainChartSpec } from '~/finance/charts/domain/schemas/chart-spec';

declare global {
  namespace PrismaJson {
    type ChartSpec = DomainChartSpec;
  }
}

export {};
