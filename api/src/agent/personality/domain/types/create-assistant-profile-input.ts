import type { TreatmentStyle } from '../constants/treatment-style';

export interface CreateAssistantProfileInput {
  readonly userId: string;
  readonly treatmentStyle: TreatmentStyle;
  readonly voiceId: string;
  readonly avatarUrl: string | null;
}
