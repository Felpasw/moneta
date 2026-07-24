import { AddUserBanksTool } from '~/agent/tools/onboarding/add-user-banks.tool';
import type { AddUserBanksUseCase } from '~/finance/accounts/application/use-cases/add-user-banks.use-case';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const VALID_UUID = 'a4b1c1e0-0000-4000-8000-000000000001';
const OTHER_UUID = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildTool = (): {
  tool: AddUserBanksTool;
  useCase: { execute: jest.Mock };
} => {
  const useCase = { execute: jest.fn() };
  const tool = new AddUserBanksTool(useCase as unknown as AddUserBanksUseCase);
  return { tool, useCase };
};

describe('AddUserBanksTool', () => {
  it('delega ao use-case com userId do ctx + bankIds do input', async () => {
    const { tool, useCase } = buildTool();
    const useCaseResult = {
      created: [{ accountId: 'acc-1', bankName: 'Nubank' }],
      notFound: [] as string[],
    };
    useCase.execute.mockResolvedValue(useCaseResult);

    const result = await tool.execute({ bankIds: [VALID_UUID] }, CTX);

    expect(result).toEqual({ ok: true, data: useCaseResult });
    expect(useCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      bankIds: [VALID_UUID],
    });
  });

  it('rejeita bankIds vazio', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute({ bankIds: [] }, CTX);

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita item que não é uuid', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute({ bankIds: [VALID_UUID, 'nubank'] }, CTX);

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejeita quando bankIds não é array', async () => {
    const { tool, useCase } = buildTool();

    const result = await tool.execute({ bankIds: VALID_UUID }, CTX);

    expect(result.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('aceita múltiplos uuids válidos', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockResolvedValue({ created: [], notFound: [] });

    await tool.execute({ bankIds: [VALID_UUID, OTHER_UUID] }, CTX);

    expect(useCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      bankIds: [VALID_UUID, OTHER_UUID],
    });
  });
});
