import { AddCategoryTool } from '~/categories/tools/add-category.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const addCategory = { execute: jest.fn() };
  const tool = new AddCategoryTool(addCategory as never);
  return { tool, addCategory };
};

describe('AddCategoryTool', () => {
  it('creates a custom category and returns ok:true with the record', async () => {
    const { tool, addCategory } = buildTool();
    const created = {
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros',
      icon: null,
      color: null,
    };
    addCategory.execute.mockResolvedValue(created);

    const result = await tool.execute({ name: 'Livros', icon: 'book' }, CTX);

    expect(result).toEqual({ ok: true, data: created });
    expect(addCategory.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Livros',
      icon: 'book',
    });
  });

  it('returns ok:false when the input fails Zod validation', async () => {
    const { tool, addCategory } = buildTool();

    const result = await tool.execute({ name: '' }, CTX);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid input');
    expect(addCategory.execute).not.toHaveBeenCalled();
  });
});
