import { OutputLanguage } from '~/agent/domain/constants/output-language';
import { LANGUAGE_SNIPPETS } from '~/agent/domain/prompts/language';

describe('LANGUAGE_SNIPPETS', () => {
  it('has an entry for every OutputLanguage value', () => {
    for (const language of Object.values(OutputLanguage)) {
      expect(LANGUAGE_SNIPPETS[language]).toBeDefined();
      expect(typeof LANGUAGE_SNIPPETS[language]).toBe('string');
      expect(LANGUAGE_SNIPPETS[language].trim().length).toBeGreaterThan(0);
    }
  });

  it('produces distinct snippets across languages', () => {
    const values = Object.values(LANGUAGE_SNIPPETS).map((v) => v.trim());
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('pt-BR snippet forces Brazilian Portuguese output', () => {
    expect(LANGUAGE_SNIPPETS[OutputLanguage.PtBr]).toMatch(
      /portugu(ê|e)s do brasil|pt-br/i,
    );
    expect(LANGUAGE_SNIPPETS[OutputLanguage.PtBr]).toMatch(/exclusivamente/i);
  });

  it('en-US snippet forces American English output', () => {
    expect(LANGUAGE_SNIPPETS[OutputLanguage.EnUs]).toMatch(
      /american english|en-us/i,
    );
    expect(LANGUAGE_SNIPPETS[OutputLanguage.EnUs]).toMatch(/exclusively/i);
  });

  it('both snippets preserve BRL/R$ as the monetary unit', () => {
    for (const snippet of Object.values(LANGUAGE_SNIPPETS)) {
      expect(snippet).toMatch(/BRL/);
      expect(snippet).toMatch(/R\$/);
    }
  });
});
