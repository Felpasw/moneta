import type { OutputLanguage } from '~/agent/domain/constants/output-language';

import type { TreatmentStyle } from '../constants/treatment-style';

export interface UpdateAssistantProfileInput {
  readonly treatmentStyle?: TreatmentStyle;
  readonly outputLanguage?: OutputLanguage;
  readonly voiceId?: string;
  readonly avatarUrl?: string | null;
}
