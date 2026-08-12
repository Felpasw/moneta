import { DEFAULT_OUTPUT_LANGUAGE } from '~/agent/domain/constants/output-language';

import type { ComposeSystemPromptInput } from '../types/compose-system-prompt-input';

import { BASE_PROMPT } from './base';
import { DASHBOARD_TOUR_SNIPPET } from './dashboard-tour';
import { LANGUAGE_SNIPPETS } from './language';
import { ONBOARDING_SNIPPET } from './onboarding';
import { TREATMENT_SNIPPETS } from './treatment';

const buildUserLine = (
  userName: string | null,
  userNickname: string | null,
): string => {
  const parts: string[] = [];
  if (userName) parts.push(`The user's name is ${userName}.`);
  if (userNickname) parts.push(`Their chosen nickname is ${userNickname}.`);
  if (parts.length === 0) return '';
  return `\n\n${parts.join(' ')}`;
};

export const composeSystemPrompt = ({
  treatmentStyle,
  outputLanguage = DEFAULT_OUTPUT_LANGUAGE,
  onboarding = false,
  dashboardTour = false,
  userName = null,
  userNickname = null,
  onboardingResume = null,
}: ComposeSystemPromptInput): string => {
  const core = `${BASE_PROMPT}\n\n${LANGUAGE_SNIPPETS[outputLanguage]}\n\n${TREATMENT_SNIPPETS[treatmentStyle]}`;
  if (dashboardTour) {
    return `${core}\n\n${DASHBOARD_TOUR_SNIPPET}${buildUserLine(userName, userNickname)}`;
  }
  if (onboarding) {
    const resumeBlock = onboardingResume ? `\n\n${onboardingResume}` : '';
    return `${core}\n\n${ONBOARDING_SNIPPET}${buildUserLine(userName, userNickname)}${resumeBlock}`;
  }
  return core;
};
