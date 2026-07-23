import { SetAccountBalancesTool } from '~/agent/tools/onboarding/set-account-balances.tool';
import type { SetAccountBalancesUseCase } from '~/finance/accounts/application/use-cases/set-account-balances.use-case';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const UUID_A = 'a4b1c1e0-0000-4000-8000-000000000001';
const UUID_B = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildTool = (): {
  tool: SetAccountBalancesTool;
  useCase: { execute: jest.Mock };
} => {
  const useCase = { execute: jest.fn() };
  const tool = new SetAccountBalancesTool(
    useCase as unknown as SetAccountBalancesUseCase,
  );
  return { tool, useCase };
};

describe('SetAccountBalancesTool', () => {
  it('delega ao use-case e retorna ok/data', async () => {
    const { tool, useCase } = buildTool();
    const useCaseResult = {
      updated: [{ accountId: UUID_A, balance: 5000 }],
      notFound: [] as string[],
    };
    useCase.execute.mockResolvedValue(useCaseResult);

    const result = await tool.execute(
      { balances: [{ accountId: UUID_A, balance: 5000 }] },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: useCaseResult });
    expect(useCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      balances: [{ accountId: UUID_A, balance: 5000 }],
    });
  });

  it('rejeita balance negativo', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      { balances: [{ accountId: UUID_A, balance: -1 }] },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita duplicata do mesmo accountId no batch', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      {
        balances: [
          { accountId: UUID_A, balance: 3000 },
          { accountId: UUID_A, balance: 5000 },
        ],
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita balances vazio', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute({ balances: [] }, CTX);

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita accountId que não é uuid', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      { balances: [{ accountId: 'nubank', balance: 100 }] },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('aceita balance zero e balance com decimais', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockResolvedValue({ updated: [], notFound: [] });

    await tool.execute(
      {
        balances: [
          { accountId: UUID_A, balance: 0 },
          { accountId: UUID_B, balance: 123.45 },
        ],
      },
      CTX,
    );

    expect(useCase.execute).toHaveBeenCalled();
  });
});
