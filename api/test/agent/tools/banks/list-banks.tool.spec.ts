import { ListBanksTool } from '~/agent/tools/banks/list-banks.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const listBanks = { execute: jest.fn() };
  const tool = new ListBanksTool(listBanks as never);
  return { tool, listBanks };
};

describe('ListBanksTool', () => {
  it('returns the catalog wrapped as ok:true', async () => {
    const { tool, listBanks } = buildTool();
    const catalog = [
      { id: 'b-1', name: 'Nubank', compeCode: '260', logoUrl: null },
    ];
    listBanks.execute.mockResolvedValue(catalog);

    const result = await tool.execute(undefined, CTX);

    expect(result).toEqual({ ok: true, data: catalog });
    expect(listBanks.execute).toHaveBeenCalledTimes(1);
  });
});
