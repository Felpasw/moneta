import { OutputLanguage } from '~/agent/domain/constants/output-language';

import { EN_US_LANGUAGE_SNIPPET } from './en-us';
import { PT_BR_LANGUAGE_SNIPPET } from './pt-br';

export const LANGUAGE_SNIPPETS: Record<OutputLanguage, string> = {
  [OutputLanguage.PtBr]: PT_BR_LANGUAGE_SNIPPET,
  [OutputLanguage.EnUs]: EN_US_LANGUAGE_SNIPPET,
};
