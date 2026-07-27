import { buildOnboardingResumeBlock } from '~/agent/domain/prompts/onboarding-resume';
import type { OnboardingState } from '~/onboarding/domain/types/onboarding-state';

const state = (patch: Partial<OnboardingState> = {}): OnboardingState => ({
  needsNickname: true,
  needsBanks: true,
  completed: false,
  ...patch,
});

describe('buildOnboardingResumeBlock()', () => {
  it('retorna null pra user novo (needsNickname + needsBanks) — fluxo canônico manda', () => {
    const block = buildOnboardingResumeBlock({
      state: state(),
      nickname: null,
      banksCount: 0,
    });
    expect(block).toBeNull();
  });

  it('retorna null pra user já completed — não deveria ativar em modo onboarding, safety net', () => {
    const block = buildOnboardingResumeBlock({
      state: state({
        needsNickname: false,
        needsBanks: false,
        completed: true,
      }),
      nickname: 'Felps',
      banksCount: 2,
    });
    expect(block).toBeNull();
  });

  it('retorna bloco pulando saudação quando só nickname foi setado', () => {
    const block = buildOnboardingResumeBlock({
      state: state({ needsNickname: false, needsBanks: true }),
      nickname: 'Felps',
      banksCount: 0,
    });
    expect(block).not.toBeNull();
    expect(block).toContain('Felps');
    expect(block).toMatch(/retomada|voltou|de volta/i);
    expect(block).toMatch(/bancos/i);
    expect(block).not.toMatch(/apresente.*Moneta/i);
  });

  it('retorna bloco pulando saudação e bancos quando ambos já foram feitos', () => {
    const block = buildOnboardingResumeBlock({
      state: state({ needsNickname: false, needsBanks: false }),
      nickname: 'Felps',
      banksCount: 3,
    });
    expect(block).not.toBeNull();
    expect(block).toContain('Felps');
    expect(block).toContain('3');
    expect(block).toMatch(/saldo|saldos/i);
  });

  it('edge case: needsNickname false mas nickname null — usa fallback neutro', () => {
    const block = buildOnboardingResumeBlock({
      state: state({ needsNickname: false, needsBanks: true }),
      nickname: null,
      banksCount: 0,
    });
    expect(block).not.toBeNull();
    expect(block).toMatch(/retomada|voltou|de volta/i);
  });
});
