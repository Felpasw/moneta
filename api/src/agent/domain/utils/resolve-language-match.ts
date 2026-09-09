import type { NormalizedVoiceLanguage } from '~/agent/domain/constants/normalized-voice-language';
import type { OutputLanguage } from '~/agent/domain/constants/output-language';

export type VoiceLanguageMatch = 'match' | 'mismatch' | 'unknown';

export const resolveLanguageMatch = (
  voiceLanguage: NormalizedVoiceLanguage,
  outputLanguage: OutputLanguage,
): VoiceLanguageMatch => {
  if (voiceLanguage === 'unknown') return 'unknown';
  if ((voiceLanguage as string) === (outputLanguage as string)) return 'match';
  return 'mismatch';
};
