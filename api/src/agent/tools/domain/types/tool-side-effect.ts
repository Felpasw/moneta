import type { ChartSpec } from '~/finance/charts/domain/schemas/chart-spec';
import type {
  ChartData,
  ChartDataMeta,
} from '~/finance/charts/domain/types/chart-data';

export type ToolSideEffect =
  | { readonly kind: 'redirect'; readonly target: string }
  | {
      readonly kind: 'chartOpen';
      readonly spec: ChartSpec;
      readonly data: ChartData;
      readonly meta: ChartDataMeta;
    };
