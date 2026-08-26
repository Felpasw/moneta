import type { AggregatedFrom } from '~/finance/charts/domain/types/chart-data';
import type { ResolvedDateRange } from '~/finance/charts/domain/types/resolved-date-range';
import type { TimeGrouping } from '~/finance/charts/domain/utils/format-time-bucket';

const MAX_BUCKETS = 100;
const DAY_MS = 86_400_000;

const BUCKET_MS: Record<TimeGrouping, number> = {
  day: DAY_MS,
  week: DAY_MS * 7,
  month: DAY_MS * 30.44,
  quarter: DAY_MS * 91.31,
  year: DAY_MS * 365.25,
};

const ESCALATION: Record<TimeGrouping, TimeGrouping | null> = {
  day: 'week',
  week: 'month',
  month: null,
  quarter: null,
  year: null,
};

export interface DecidedTimeGrouping {
  readonly effective: TimeGrouping;
  readonly aggregatedFrom?: AggregatedFrom;
}

const isAggregatedFrom = (g: TimeGrouping): g is AggregatedFrom =>
  g === 'day' || g === 'week' || g === 'month';

export const decideTimeGrouping = (
  requested: TimeGrouping,
  dateRange: ResolvedDateRange | undefined,
): DecidedTimeGrouping => {
  const totalMs = dateRange
    ? dateRange.to.getTime() - dateRange.from.getTime()
    : Number.POSITIVE_INFINITY;

  let effective = requested;
  while (totalMs / BUCKET_MS[effective] > MAX_BUCKETS) {
    const next = ESCALATION[effective];
    if (!next) break;
    effective = next;
  }

  if (effective === requested || !isAggregatedFrom(requested)) {
    return { effective };
  }
  return { effective, aggregatedFrom: requested };
};
