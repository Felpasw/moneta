import { COMPLETED_ONBOARDING_STATE } from '../constants/completed-onboarding-state';
import type { DeriveOnboardingStateInput } from '../types/derive-onboarding-state-input';
import type { OnboardingState } from '../types/onboarding-state';

export function deriveOnboardingState({
  user,
  accounts,
}: DeriveOnboardingStateInput): OnboardingState {
  if (user?.onboardedAt) return COMPLETED_ONBOARDING_STATE;

  return {
    needsNickname: !user?.nickname,
    needsBanks: accounts.length === 0,
    completed: false,
  };
}
