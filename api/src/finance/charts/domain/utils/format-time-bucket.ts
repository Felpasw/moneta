import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type { Grouping } from '~/finance/charts/domain/schemas/chart-spec';

dayjs.extend(utc);

export type TimeGrouping = Extract<
  Grouping,
  'day' | 'week' | 'month' | 'quarter' | 'year'
>;

const FORMATTERS: Record<TimeGrouping, (date: Date) => string> = {
  day: (date) => dayjs.utc(date).format('YYYY-MM-DD'),
  week: (date) => dayjs.utc(date).format('YYYY-[W]WW'),
  month: (date) => dayjs.utc(date).format('YYYY-MM'),
  quarter: (date) => {
    const d = dayjs.utc(date);
    return `${d.year()}-Q${Math.floor(d.month() / 3) + 1}`;
  },
  year: (date) => String(dayjs.utc(date).year()),
};

export const formatTimeBucket = (date: Date, grouping: TimeGrouping): string =>
  FORMATTERS[grouping](date);
