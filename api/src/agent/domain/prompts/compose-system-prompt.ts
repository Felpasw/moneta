import type { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

import { BASE_PROMPT } from './base';
import { TREATMENT_SNIPPETS } from './treatment';

export interface ComposeSystemPromptInput {
  readonly treatmentStyle: TreatmentStyle;
}

export const composeSystemPrompt = ({
  treatmentStyle,
}: ComposeSystemPromptInput): string => {
  return `${BASE_PROMPT}\n\n${TREATMENT_SNIPPETS[treatmentStyle]}`;
};
