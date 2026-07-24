import { ConfigureAccountDetailsTool } from '~/agent/tools/onboarding/configure-account-details.tool';
import type { ConfigureAccountDetailsUseCase } from '~/finance/accounts/application/use-cases/configure-account-details.use-case';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const UUID_A = 'a4b1c1e0-0000-4000-8000-000000000001';
const UUID_B = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildTool = (): {
  tool: ConfigureAccountDetailsTool;
  useCase: { execute: jest.Mock };
} => {
  const useCase = { execute: jest.fn() };
  const tool = new ConfigureAccountDetailsTool(
    useCase as unknown as ConfigureAccountDetailsUseCase,
  );
  return { tool, useCase };
};

describe('ConfigureAccountDetailsTool', () => {
  it('delega ao use-case com userId do ctx quando input é válido', async () => {
    const { tool, useCase } = buildTool();
    const useCaseResult = {
      updated: [{ accountId: UUID_A }],
      notFound: [] as string[],
    };
    useCase.execute.mockResolvedValue(useCaseResult);

    const result = await tool.execute(
      {
        accounts: [
          {
            accountId: UUID_A,
            creditLimit: 7000,
            closeDay: 15,
            dueDay: 22,
          },
        ],
      },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: useCaseResult });
    expect(useCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      accounts: [
        {
          accountId: UUID_A,
          creditLimit: 7000,
          closeDay: 15,
          dueDay: 22,
        },
      ],
    });
  });

  it('aceita account só com overdraftLimit (sem campos de crédito)', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockResolvedValue({ updated: [], notFound: [] });

    const result = await tool.execute(
      { accounts: [{ accountId: UUID_A, overdraftLimit: 500 }] },
      CTX,
    );

    expect(result.ok).toBe(true);
    expect(useCase.execute).toHaveBeenCalled();
  });

  it('rejeita creditLimit sem closeDay/dueDay (regra 3-together)', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      { accounts: [{ accountId: UUID_A, creditLimit: 5000 }] },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita closeDay sem creditLimit', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      { accounts: [{ accountId: UUID_A, closeDay: 15, dueDay: 22 }] },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita account sem nenhum campo (só accountId)', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      { accounts: [{ accountId: UUID_A }] },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita duplicata do mesmo accountId no batch', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      {
        accounts: [
          { accountId: UUID_A, overdraftLimit: 100 },
          { accountId: UUID_A, overdraftLimit: 200 },
        ],
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita creditLimit negativo', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      {
        accounts: [
          {
            accountId: UUID_A,
            creditLimit: -1,
            closeDay: 15,
            dueDay: 22,
          },
        ],
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita overdraftLimit negativo', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      { accounts: [{ accountId: UUID_A, overdraftLimit: -50 }] },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita closeDay fora do range 1..31', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      {
        accounts: [
          { accountId: UUID_A, creditLimit: 1000, closeDay: 32, dueDay: 5 },
        ],
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita dueDay < 1', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      {
        accounts: [
          { accountId: UUID_A, creditLimit: 1000, closeDay: 10, dueDay: 0 },
        ],
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita accountId que não é uuid', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute(
      { accounts: [{ accountId: 'nubank', overdraftLimit: 100 }] },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita array vazio', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute({ accounts: [] }, CTX);

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('aceita múltiplas contas com combinações diferentes', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockResolvedValue({ updated: [], notFound: [] });

    await tool.execute(
      {
        accounts: [
          {
            accountId: UUID_A,
            creditLimit: 7000,
            closeDay: 15,
            dueDay: 22,
          },
          { accountId: UUID_B, overdraftLimit: 500 },
        ],
      },
      CTX,
    );

    expect(useCase.execute).toHaveBeenCalled();
  });
});
