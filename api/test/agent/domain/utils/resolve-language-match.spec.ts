import { OutputLanguage } from '~/agent/domain/constants/output-language';
import { resolveLanguageMatch } from '~/agent/domain/utils/resolve-language-match';

describe('resolveLanguageMatch', () => {
  it('returns match when voice language equals output language', () => {
    expect(resolveLanguageMatch('pt_BR', OutputLanguage.PtBr)).toBe('match');
    expect(resolveLanguageMatch('en_US', OutputLanguage.EnUs)).toBe('match');
  });

  it('returns mismatch when voice language differs from output language', () => {
    expect(resolveLanguageMatch('pt_BR', OutputLanguage.EnUs)).toBe('mismatch');
    expect(resolveLanguageMatch('en_US', OutputLanguage.PtBr)).toBe('mismatch');
  });

  it('returns unknown when voice language is unknown regardless of output', () => {
    expect(resolveLanguageMatch('unknown', OutputLanguage.PtBr)).toBe(
      'unknown',
    );
    expect(resolveLanguageMatch('unknown', OutputLanguage.EnUs)).toBe(
      'unknown',
    );
  });
});
