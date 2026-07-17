import { AddBankAccountTool } from '~/accounts/tools/add-bank-account.tool';
import { InvalidCreditCardConfigError } from '~/accounts/domain/errors/invalid-credit-card-config.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const BANK_ID = 'a4b1c1e0-0000-4000-8000-000000000001';

const buildTool = () => {
  const addBankAccount = { execute: jest.fn() };
  const tool = new AddBankAccountTool(addBankAccount as never);
  return { tool, addBankAccount };
};

describe('AddBankAccountTool', () => {
  it('creates a regular account and returns ok:true with the record', async () => {
    const { tool, addBankAccount } = buildTool();
    const created = { id: 'acc-1', userId: 'user-1', nickname: 'Nubank' };
    addBankAccount.execute.mockResolvedValue(created);

    const result = await tool.execute(
      { bankId: BANK_ID, nickname: 'Nubank', initialBalance: 100 },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: created });
    expect(addBankAccount.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      bankId: BANK_ID,
      nickname: 'Nubank',
      initialBalance: 100,
    });
  });

  it('returns ok:false when the input fails Zod validation', async () => {
    const { tool, addBankAccount } = buildTool();

    const result = await tool.execute(
      { bankId: 'not-a-uuid', nickname: '' },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid input');
    expect(addBankAccount.execute).not.toHaveBeenCalled();
  });

  it('returns ok:false when the use-case rejects a broken credit card config', async () => {
    const { tool, addBankAccount } = buildTool();
    addBankAccount.execute.mockRejectedValue(
      new InvalidCreditCardConfigError(),
    );

    const result = await tool.execute(
      {
        bankId: BANK_ID,
        nickname: 'Itau',
        creditLimit: 5000,
        closeDay: 10,
        dueDay: 20,
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});
