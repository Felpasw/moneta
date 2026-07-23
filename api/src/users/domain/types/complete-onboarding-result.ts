export type CompleteOnboardingMissing = 'nickname' | 'banks';

export interface CompleteOnboardingResult {
  ok: boolean;
  alreadyOnboarded?: boolean;
  missing?: CompleteOnboardingMissing[];
}
