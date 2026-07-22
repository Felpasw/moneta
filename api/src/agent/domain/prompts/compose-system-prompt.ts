import type { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

import { BASE_PROMPT } from './base';
import { ONBOARDING_SNIPPET } from './onboarding';
import { TREATMENT_SNIPPETS } from './treatment';

export interface ComposeSystemPromptInput {
  readonly treatmentStyle: TreatmentStyle;
  readonly onboarding?: boolean;
  readonly userName?: string | null;
}

export const composeSystemPrompt = ({
  treatmentStyle,
  onboarding = false,
  userName = null,
}: ComposeSystemPromptInput): string => {
  const core = `${BASE_PROMPT}\n\n${TREATMENT_SNIPPETS[treatmentStyle]}`;
  if (!onboarding) return core;
  const userLine = userName ? `\n\nO nome do usuário é ${userName}.` : '';
  return `${core}\n\n${ONBOARDING_SNIPPET}${userLine}`;
};
