import type { OutputLanguage } from '~/agent/domain/constants/output-language';

import type { TreatmentStyle } from '../constants/treatment-style';

export interface AssistantProfile {
  readonly id: string;
  readonly userId: string;
  readonly treatmentStyle: TreatmentStyle;
  readonly outputLanguage: OutputLanguage;
  readonly voiceId: string;
  readonly avatarUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
