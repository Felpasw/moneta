import type { DatePreset } from '~/finance/charts/domain/schemas/chart-spec';
import type { PresetResolver } from '~/finance/charts/domain/types/preset-resolver';

export const PRESET_RESOLVERS: Record<DatePreset, PresetResolver> = {
  all_time: () => undefined,
  this_month: (base) => ({
    from: base.startOf('month').toDate(),
    to: base.endOf('month').toDate(),
  }),
  ytd: (base, now) => ({
    from: base.startOf('year').toDate(),
    to: now,
  }),
};
