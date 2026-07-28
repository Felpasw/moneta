import {
  ONBOARDING_SNIPPET,
  ONBOARDING_SNIPPET_VERSION,
} from '~/agent/domain/prompts/onboarding';

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

  it('encerra chamando finish_setup no fim, não complete_onboarding', () => {
    expect(ONBOARDING_SNIPPET).toMatch(/\bfinish_setup\b/);
    expect(ONBOARDING_SNIPPET).not.toMatch(/\bcomplete_onboarding\b/);
  });

  it('usa a confirmação "posso finalizar seu setup?" antes da tool final', () => {
    expect(ONBOARDING_SNIPPET.toLowerCase()).toContain(
      'posso finalizar seu setup',
    );
  });

  it('inclui finish_setup na lista de tools de escrita que exigem confirmação', () => {
    const goldenRuleBlock =
      /Antes de invocar QUALQUER tool[^)]+finish_setup[^)]*\)/;
    expect(ONBOARDING_SNIPPET).toMatch(goldenRuleBlock);
  });

  it('bump de versão pra 4 refletindo a troca da tool final', () => {
    expect(ONBOARDING_SNIPPET_VERSION).toBe(4);
  });

  it('antes do redirect, avisa que vai levar o user pra parte inicial do app e apresentar as funcionalidades', () => {
    const lower = ONBOARDING_SNIPPET.toLowerCase();
    expect(lower).toContain('parte inicial do app');
    expect(lower).toMatch(/funcionalidad|apresent/);
  });
});
