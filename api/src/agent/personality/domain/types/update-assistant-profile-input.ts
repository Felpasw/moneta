import type { TreatmentStyle } from '../constants/treatment-style';

export interface UpdateAssistantProfileInput {
  readonly treatmentStyle?: TreatmentStyle;
  readonly voiceId?: string;
  readonly avatarUrl?: string | null;
}
