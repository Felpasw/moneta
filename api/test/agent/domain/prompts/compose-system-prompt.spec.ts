import { BASE_PROMPT } from '~/agent/domain/prompts/base';
import { composeSystemPrompt } from '~/agent/domain/prompts/compose-system-prompt';
import { ONBOARDING_SNIPPET } from '~/agent/domain/prompts/onboarding';
import { TREATMENT_SNIPPETS } from '~/agent/domain/prompts/treatment';
import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';

describe('composeSystemPrompt', () => {
  it.each(Object.values(TreatmentStyle))(
    'starts with base and appends the treatment snippet for %s',
    (style) => {
      const prompt = composeSystemPrompt({ treatmentStyle: style });

      expect(prompt.startsWith(BASE_PROMPT)).toBe(true);
      expect(prompt).toContain(TREATMENT_SNIPPETS[style]);
    },
  );

  it('separates base and treatment with a blank line', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
    });

    expect(prompt).toBe(
      `${BASE_PROMPT}\n\n${TREATMENT_SNIPPETS[TreatmentStyle.Informal]}`,
    );
  });

  it('não inclui snippet de onboarding quando onboarding=false (default)', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
    });
    expect(prompt).not.toContain(ONBOARDING_SNIPPET);
  });

  it('anexa snippet de onboarding no fim quando onboarding=true', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
      onboarding: true,
    });
    expect(prompt).toContain(ONBOARDING_SNIPPET);
  });

  it('injeta o nome do usuário no prompt quando onboarding=true + userName', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
      onboarding: true,
      userName: 'Felipe',
    });
    expect(prompt).toContain('Felipe');
  });

  it('não injeta userName quando onboarding=false', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
      userName: 'Felipe',
    });
    expect(prompt).not.toContain('Felipe');
  });

  it('produces different prompts for different styles', () => {
    const formal = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Formal,
    });
    const informal = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
    });
    const veryInformal = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.VeryInformal,
    });

    expect(formal).not.toBe(informal);
    expect(informal).not.toBe(veryInformal);
    expect(formal).not.toBe(veryInformal);
  });
});
