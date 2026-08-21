import type dayjs from 'dayjs';

import type { RollingUnit } from '~/finance/charts/domain/schemas/chart-spec';

interface RollingUnitEntry {
  readonly unit: dayjs.ManipulateType;
  readonly multiplier: number;
}

export const ROLLING_UNIT_MAP: Record<RollingUnit, RollingUnitEntry> = {
  day: { unit: 'day', multiplier: 1 },
  week: { unit: 'day', multiplier: 7 },
  month: { unit: 'month', multiplier: 1 },
  quarter: { unit: 'month', multiplier: 3 },
  year: { unit: 'year', multiplier: 1 },
};
