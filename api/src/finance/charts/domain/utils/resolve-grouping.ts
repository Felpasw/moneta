import type {
  ChartSpec,
  Grouping,
  XField,
} from '~/finance/charts/domain/schemas/chart-spec';

const FIELD_FALLBACK: Record<Exclude<XField, 'date'>, Grouping> = {
  category: 'category',
  bank: 'bank',
  transactionType: 'transactionType',
};

export const resolveGrouping = (xAxis: ChartSpec['xAxis']): Grouping => {
  if (xAxis.grouping) return xAxis.grouping;
  if (xAxis.field === 'date') return 'month';
  return FIELD_FALLBACK[xAxis.field];
};
