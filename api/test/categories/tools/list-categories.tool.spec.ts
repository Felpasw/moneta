import { ListCategoriesTool } from '~/categories/tools/list-categories.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const listCategories = { execute: jest.fn() };
  const tool = new ListCategoriesTool(listCategories as never);
  return { tool, listCategories };
};

describe('ListCategoriesTool', () => {
  it('returns categories visible to ctx.userId', async () => {
    const { tool, listCategories } = buildTool();
    const rows = [
      {
        id: 'g-1',
        userId: null,
        name: 'Alimentação',
        icon: null,
        color: null,
      },
    ];
    listCategories.execute.mockResolvedValue(rows);

    const result = await tool.execute({}, CTX);

    expect(result).toEqual({ ok: true, data: rows });
    expect(listCategories.execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});
