import { BASE_PROMPT } from '~/agent/domain/prompts/base';
import { composeSystemPrompt } from '~/agent/domain/prompts/compose-system-prompt';
import { DASHBOARD_TOUR_SNIPPET } from '~/agent/domain/prompts/dashboard-tour';
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

  it('anexa DASHBOARD_TOUR_SNIPPET quando dashboardTour=true (sem onboarding)', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
      dashboardTour: true,
    });
    expect(prompt).toContain(DASHBOARD_TOUR_SNIPPET);
    expect(prompt).not.toContain(ONBOARDING_SNIPPET);
  });

  it('dashboardTour e onboarding são mutuamente exclusivos — tour vence quando ambos passados', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
      dashboardTour: true,
      onboarding: true,
    });
    expect(prompt).toContain(DASHBOARD_TOUR_SNIPPET);
    expect(prompt).not.toContain(ONBOARDING_SNIPPET);
  });

  it('injeta userName quando dashboardTour=true', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
      dashboardTour: true,
      userName: 'Felipe',
    });
    expect(prompt).toContain('Felipe');
  });

  it('injeta userNickname quando dashboardTour=true (agente reconhece o apelido escolhido no onboarding)', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
      dashboardTour: true,
      userNickname: 'Felps',
    });
    expect(prompt).toContain('Felps');
  });

  it('não injeta DASHBOARD_TOUR_SNIPPET quando dashboardTour=false (default)', () => {
    const prompt = composeSystemPrompt({
      treatmentStyle: TreatmentStyle.Informal,
    });
    expect(prompt).not.toContain(DASHBOARD_TOUR_SNIPPET);
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
