import { AgentMode } from '~/agent/domain/constants/agent-mode';
import { resolveAgentMode } from '~/agent/domain/prompts/agent-mode';

describe('resolveAgentMode', () => {
  it('user já onboarded (onboardedAt setado) → free (nem onboarding nem tour)', () => {
    expect(
      resolveAgentMode({
        hasNickname: true,
        hasBanks: true,
        onboardedAt: new Date('2026-01-01'),
      }),
    ).toBe(AgentMode.Free);
  });

  it('user com nickname + banks + !onboardedAt → dashboardTour', () => {
    expect(
      resolveAgentMode({
        hasNickname: true,
        hasBanks: true,
        onboardedAt: null,
      }),
    ).toBe(AgentMode.DashboardTour);
  });

  it('user fresh (sem nickname, sem banks, !onboardedAt) → onboarding', () => {
    expect(
      resolveAgentMode({
        hasNickname: false,
        hasBanks: false,
        onboardedAt: null,
      }),
    ).toBe(AgentMode.Onboarding);
  });

  it('user meio-caminho (nickname mas sem banks) → onboarding (ainda coletando)', () => {
    expect(
      resolveAgentMode({
        hasNickname: true,
        hasBanks: false,
        onboardedAt: null,
      }),
    ).toBe(AgentMode.Onboarding);
  });

  it('user meio-caminho (banks mas sem nickname) → onboarding', () => {
    expect(
      resolveAgentMode({
        hasNickname: false,
        hasBanks: true,
        onboardedAt: null,
      }),
    ).toBe(AgentMode.Onboarding);
  });

  it('user com onboardedAt vence qualquer combinação — free', () => {
    expect(
      resolveAgentMode({
        hasNickname: false,
        hasBanks: false,
        onboardedAt: new Date('2026-01-01'),
      }),
    ).toBe(AgentMode.Free);
  });
});
