import { TREATMENT_SNIPPETS } from '~/agent/domain/prompts/treatment';
import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

describe('TREATMENT_SNIPPETS', () => {
  it('has an entry for every TreatmentStyle value', () => {
    const styles = Object.values(TreatmentStyle);
    for (const style of styles) {
      expect(TREATMENT_SNIPPETS[style]).toBeDefined();
      expect(typeof TREATMENT_SNIPPETS[style]).toBe('string');
      expect(TREATMENT_SNIPPETS[style].trim().length).toBeGreaterThan(0);
    }
  });

  it('has no duplicated snippet across styles', () => {
    const values = Object.values(TREATMENT_SNIPPETS).map((v) => v.trim());
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('formal snippet uses formal treatment cues', () => {
    expect(TREATMENT_SNIPPETS[TreatmentStyle.Formal]).toMatch(
      /formalidade|senhor|senhora/i,
    );
  });

  it('informal snippet reads as friendly not distant', () => {
    expect(TREATMENT_SNIPPETS[TreatmentStyle.Informal]).toMatch(/amigo/i);
  });

  it('very-informal snippet embraces roasting, slang and profanity', () => {
    const snippet = TREATMENT_SNIPPETS[TreatmentStyle.VeryInformal];
    expect(snippet).toMatch(/palavr(õ|o)es/i);
    expect(snippet).toMatch(/zoa/i);
    expect(snippet).toMatch(/deboche|sarcasmo|iron(i|í)a/i);
  });

  it('very-informal snippet forbids targeting the person, only financial decisions', () => {
    const snippet = TREATMENT_SNIPPETS[TreatmentStyle.VeryInformal];
    expect(snippet).toMatch(
      /nunca sobre a pessoa|nunca.*pessoa|só decis(ã|a)o financeira/i,
    );
  });
});
