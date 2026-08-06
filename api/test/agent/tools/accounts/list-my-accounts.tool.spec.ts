import { ListMyAccountsTool } from '~/agent/tools/accounts/list-my-accounts.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const listMyAccounts = { execute: jest.fn() };
  const tool = new ListMyAccountsTool(listMyAccounts as never);
  return { tool, listMyAccounts };
};

describe('ListMyAccountsTool', () => {
  it('wraps use-case result (items + summary) as tool data', async () => {
    const { tool, listMyAccounts } = buildTool();
    const payload = {
      items: [],
      summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
    };
    listMyAccounts.execute.mockResolvedValue(payload);

    const result = await tool.execute({}, CTX);

    expect(result).toEqual({ ok: true, data: payload });
    expect(listMyAccounts.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});
