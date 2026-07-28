import type { OnboardingState } from '~/onboarding/domain/types/onboarding-state';

export interface BuildOnboardingResumeBlockInput {
  state: OnboardingState;
  nickname: string | null;
  banksCount: number;
}
