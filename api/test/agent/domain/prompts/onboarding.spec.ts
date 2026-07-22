import { ONBOARDING_SNIPPET } from '~/agent/domain/prompts/onboarding';

describe('ONBOARDING_SNIPPET', () => {
  it('sinaliza que é a primeira interação e pede apelido', () => {
    expect(ONBOARDING_SNIPPET.toLowerCase()).toMatch(/primeira/);
    expect(ONBOARDING_SNIPPET.toLowerCase()).toMatch(/apelido|nickname/);
  });

  it('menciona uso do nome do usuário na saudação', () => {
    expect(ONBOARDING_SNIPPET).toMatch(/users\.name|nome do usu[aá]rio/i);
  });

  it('descreve o que a Moneta faz em uma linha curta', () => {
    expect(ONBOARDING_SNIPPET.toLowerCase()).toContain('moneta');
  });
});
