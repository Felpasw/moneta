import { AgentMode } from '~/agent/domain/constants/agent-mode';
import { OutputLanguage } from '~/agent/domain/constants/output-language';
import { buildOpenResponsePayload } from '~/agent/infrastructure/gateways/utils/build-open-response-payload';

describe('buildOpenResponsePayload', () => {
  it('returns a plain response.create for AgentMode.Onboarding', () => {
    const payload = buildOpenResponsePayload({
      mode: AgentMode.Onboarding,
      userName: null,
      userNickname: null,
      outputLanguage: OutputLanguage.PtBr,
    });

    expect(payload).toEqual({ type: 'response.create' });
  });

  it('returns a plain response.create for AgentMode.DashboardTour', () => {
    const payload = buildOpenResponsePayload({
      mode: AgentMode.DashboardTour,
      userName: null,
      userNickname: null,
      outputLanguage: OutputLanguage.PtBr,
    });

    expect(payload).toEqual({ type: 'response.create' });
  });

  it('returns a pt-BR welcome-back for AgentMode.Free using nickname when available', () => {
    const payload = buildOpenResponsePayload({
      mode: AgentMode.Free,
      userName: 'Felipe Cavalcante',
      userNickname: 'Felpa',
      outputLanguage: OutputLanguage.PtBr,
    });

    expect(payload).toMatchObject({ type: 'response.create' });
    expect(payload).toHaveProperty('response.instructions');
    const instructions = (payload as { response: { instructions: string } })
      .response.instructions;
    expect(instructions).toContain('Felpa');
    expect(instructions.toLowerCase()).toContain('volta');
    expect(instructions).toMatch(/portugu(ê|e)s/i);
  });

  it('returns an en-US welcome-back when outputLanguage=en_US', () => {
    const payload = buildOpenResponsePayload({
      mode: AgentMode.Free,
      userName: 'Felipe Cavalcante',
      userNickname: 'Felpa',
      outputLanguage: OutputLanguage.EnUs,
    });

    const instructions = (payload as { response: { instructions: string } })
      .response.instructions;
    expect(instructions).toContain('Felpa');
    expect(instructions.toLowerCase()).toContain('welcome-back');
    expect(instructions).toMatch(/english/i);
  });

  it('falls back to userName when nickname is null in AgentMode.Free', () => {
    const payload = buildOpenResponsePayload({
      mode: AgentMode.Free,
      userName: 'Felipe',
      userNickname: null,
      outputLanguage: OutputLanguage.PtBr,
    });

    const instructions = (payload as { response: { instructions: string } })
      .response.instructions;
    expect(instructions).toContain('Felipe');
  });

  it('omits the name from Free instructions when both name and nickname are null', () => {
    const payload = buildOpenResponsePayload({
      mode: AgentMode.Free,
      userName: null,
      userNickname: null,
      outputLanguage: OutputLanguage.PtBr,
    });

    const instructions = (payload as { response: { instructions: string } })
      .response.instructions;
    expect(instructions.toLowerCase()).toContain('volta');
    expect(instructions).not.toMatch(/\bnull\b/);
    expect(instructions).not.toMatch(/undefined/);
  });
});
