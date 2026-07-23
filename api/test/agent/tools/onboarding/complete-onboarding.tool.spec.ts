import { CompleteOnboardingTool } from '~/agent/tools/onboarding/complete-onboarding.tool';
import type { CompleteOnboardingUseCase } from '~/users/application/use-cases/complete-onboarding.use-case';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = (): {
  tool: CompleteOnboardingTool;
  useCase: { execute: jest.Mock };
} => {
  const useCase = { execute: jest.fn() };
  const tool = new CompleteOnboardingTool(
    useCase as unknown as CompleteOnboardingUseCase,
  );
  return { tool, useCase };
};

describe('CompleteOnboardingTool', () => {
  it('delega ao use-case com userId do ctx e retorna ok/data', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockResolvedValue({ ok: true });

    const result = await tool.execute({}, CTX);

    expect(result).toEqual({ ok: true, data: { ok: true } });
    expect(useCase.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('propaga missing do use-case quando ok:false', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockResolvedValue({ ok: false, missing: ['nickname'] });

    const result = await tool.execute({}, CTX);

    expect(result).toEqual({
      ok: true,
      data: { ok: false, missing: ['nickname'] },
    });
  });

  it('propaga alreadyOnboarded quando use-case retorna idempotência', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockResolvedValue({ ok: true, alreadyOnboarded: true });

    const result = await tool.execute({}, CTX);

    expect(result).toEqual({
      ok: true,
      data: { ok: true, alreadyOnboarded: true },
    });
  });

  it('rejeita input com properties extras (strict)', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute({ userId: 'attacker' }, CTX);

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });
});
