import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { PRESET_RESOLVERS } from '~/finance/charts/domain/constants/preset-resolvers';
import { ROLLING_UNIT_MAP } from '~/finance/charts/domain/constants/rolling-unit-map';
import type { DateRange } from '~/finance/charts/domain/schemas/chart-spec';
import type { ResolvedDateRange } from '~/finance/charts/domain/types/resolved-date-range';

dayjs.extend(utc);

export const resolveDateRange = (
  range: DateRange,
  now: Date,
): ResolvedDateRange | undefined => {
  if ('from' in range) {
    return {
      from: dayjs.utc(range.from).toDate(),
      to: dayjs.utc(range.to).toDate(),
    };
  }

  if ('preset' in range) {
    return PRESET_RESOLVERS[range.preset](dayjs.utc(now), now);
  }

  const { unit, n } = range.rolling;
  const mapped = ROLLING_UNIT_MAP[unit];
  const from = dayjs.utc(now).subtract(n * mapped.multiplier, mapped.unit);

  return { from: from.toDate(), to: now };
};
