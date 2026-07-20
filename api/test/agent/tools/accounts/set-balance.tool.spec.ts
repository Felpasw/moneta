import { SetBalanceTool } from '~/agent/tools/accounts/set-balance.tool';
import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildTool = () => {
  const setBalance = { execute: jest.fn() };
  const tool = new SetBalanceTool(setBalance as never);
  return { tool, setBalance };
};

describe('SetBalanceTool', () => {
  it('overwrites the balance and returns the fresh account snapshot', async () => {
    const { tool, setBalance } = buildTool();
    const updated = { id: ACCOUNT_ID, balance: 500 };
    setBalance.execute.mockResolvedValue(updated);

    const result = await tool.execute(
      { accountId: ACCOUNT_ID, amount: 500 },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: updated });
    expect(setBalance.execute).toHaveBeenCalledWith({
      id: ACCOUNT_ID,
      userId: 'user-1',
      amount: 500,
    });
  });

  it('accepts negative amounts (overdraft/debt scenarios)', async () => {
    const { tool, setBalance } = buildTool();
    setBalance.execute.mockResolvedValue({ id: ACCOUNT_ID, balance: -50 });

    const result = await tool.execute(
      { accountId: ACCOUNT_ID, amount: -50 },
      CTX,
    );

    expect(result.ok).toBe(true);
  });

  it('returns ok:false when the account is not found', async () => {
    const { tool, setBalance } = buildTool();
    setBalance.execute.mockRejectedValue(new AccountNotFoundError(ACCOUNT_ID));

    const result = await tool.execute(
      { accountId: ACCOUNT_ID, amount: 100 },
      CTX,
    );

    expect(result.ok).toBe(false);
  });
});
