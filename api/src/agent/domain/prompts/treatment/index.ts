import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

import { FORMAL_TREATMENT_SNIPPET } from './formal';
import { INFORMAL_TREATMENT_SNIPPET } from './informal';
import { VERY_INFORMAL_TREATMENT_SNIPPET } from './very-informal';

export const TREATMENT_SNIPPETS: Record<TreatmentStyle, string> = {
  [TreatmentStyle.Formal]: FORMAL_TREATMENT_SNIPPET,
  [TreatmentStyle.Informal]: INFORMAL_TREATMENT_SNIPPET,
  [TreatmentStyle.VeryInformal]: VERY_INFORMAL_TREATMENT_SNIPPET,
};
