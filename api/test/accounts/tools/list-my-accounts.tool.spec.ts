import { ListMyAccountsTool } from '~/accounts/tools/list-my-accounts.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const listMyAccounts = { execute: jest.fn() };
  const tool = new ListMyAccountsTool(listMyAccounts as never);
  return { tool, listMyAccounts };
};

describe('ListMyAccountsTool', () => {
  it('lists accounts of the user from ctx.userId', async () => {
    const { tool, listMyAccounts } = buildTool();
    listMyAccounts.execute.mockResolvedValue([]);

    const result = await tool.execute({}, CTX);

    expect(result).toEqual({ ok: true, data: [] });
    expect(listMyAccounts.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});
