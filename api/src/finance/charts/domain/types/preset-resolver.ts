import type dayjs from 'dayjs';

import type { ResolvedDateRange } from '~/finance/charts/domain/types/resolved-date-range';

export type PresetResolver = (
  base: dayjs.Dayjs,
  now: Date,
) => ResolvedDateRange | undefined;
