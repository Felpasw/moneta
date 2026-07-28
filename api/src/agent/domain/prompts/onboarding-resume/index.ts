import { OnboardingResumePhase } from '~/agent/domain/constants/onboarding-resume-phase';
import type { BuildOnboardingResumeBlockInput } from '~/agent/domain/types/build-onboarding-resume-block-input';
import type { OnboardingState } from '~/onboarding/domain/types/onboarding-state';

import { buildNicknameOnlyResumeSnippet } from './nickname-only';
import { buildReadyForBalancesResumeSnippet } from './ready-for-balances';

const RENDER: Record<
  OnboardingResumePhase,
  (ctx: { nickname: string | null; banksCount: number }) => string
> = {
  [OnboardingResumePhase.NicknameOnly]: ({ nickname }) =>
    buildNicknameOnlyResumeSnippet({ nickname }),
  [OnboardingResumePhase.ReadyForBalances]: ({ nickname, banksCount }) =>
    buildReadyForBalancesResumeSnippet({ nickname, banksCount }),
};

const resolvePhase = (state: OnboardingState): OnboardingResumePhase | null => {
  if (state.completed) return null;
  if (state.needsNickname && state.needsBanks) return null;
  if (state.needsBanks) return OnboardingResumePhase.NicknameOnly;
  return OnboardingResumePhase.ReadyForBalances;
};

export function buildOnboardingResumeBlock({
  state,
  nickname,
  banksCount,
}: BuildOnboardingResumeBlockInput): string | null {
  const phase = resolvePhase(state);
  if (!phase) return null;
  return RENDER[phase]({ nickname, banksCount });
}
