import { FinishSetupTool } from '~/agent/tools/onboarding/finish-setup.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

describe('FinishSetupTool', () => {
  it('retorna ok:true sem chamar nenhum use-case (sem side-effect no DB)', async () => {
    const tool = new FinishSetupTool();

    const result = await tool.execute({}, CTX);

    expect(result.ok).toBe(true);
  });

  it('emite side-effect kind:redirect com target /dashboard', async () => {
    const tool = new FinishSetupTool();

    const result = await tool.execute({}, CTX);

    expect(result.sideEffects).toEqual([
      { kind: 'redirect', target: '/dashboard' },
    ]);
  });

  it('rejeita input com properties extras (strict)', async () => {
    const tool = new FinishSetupTool();

    const result = await tool.execute({ userId: 'attacker' }, CTX);

    expect(result.ok).toBe(false);
    expect(result.sideEffects).toBeUndefined();
  });

  it('expõe metadata: name finish_setup + description + playbook não-vazio', () => {
    const tool = new FinishSetupTool();

    expect(tool.name).toBe('finish_setup');
    expect(tool.description).toEqual(expect.any(String));
    expect(tool.description.length).toBeGreaterThan(0);
    expect(tool.playbook).toEqual(expect.any(String));
    expect(tool.playbook.length).toBeGreaterThan(0);
  });
});
