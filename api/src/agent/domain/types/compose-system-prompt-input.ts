import type { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

export interface ComposeSystemPromptInput {
  readonly treatmentStyle: TreatmentStyle;
  readonly onboarding?: boolean;
  readonly dashboardTour?: boolean;
  readonly userName?: string | null;
  readonly userNickname?: string | null;
  readonly onboardingResume?: string | null;
}
