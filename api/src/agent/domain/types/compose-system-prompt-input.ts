import type { OutputLanguage } from '~/agent/domain/constants/output-language';
import type { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

export interface ComposeSystemPromptInput {
  readonly treatmentStyle: TreatmentStyle;
  readonly outputLanguage?: OutputLanguage;
  readonly onboarding?: boolean;
  readonly dashboardTour?: boolean;
  readonly userName?: string | null;
  readonly userNickname?: string | null;
  readonly onboardingResume?: string | null;
}
