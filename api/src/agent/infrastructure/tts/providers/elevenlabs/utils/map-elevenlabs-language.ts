import type { NormalizedVoiceLanguage } from '~/agent/domain/constants/normalized-voice-language';

const PORTUGUESE_TOKENS = new Set(['pt', 'ptbr', 'portuguese']);
const ENGLISH_TOKENS = new Set(['en', 'enus', 'english']);

const canonicalize = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, '');

export const mapElevenLabsLanguage = (
  raw?: string,
): NormalizedVoiceLanguage => {
  if (raw === undefined) return 'unknown';
  const token = canonicalize(raw);
  if (token === '') return 'unknown';
  if (PORTUGUESE_TOKENS.has(token)) return 'pt_BR';
  if (ENGLISH_TOKENS.has(token)) return 'en_US';
  return 'unknown';
};
