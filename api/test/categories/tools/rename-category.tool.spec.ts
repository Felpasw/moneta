import { RenameCategoryTool } from '~/categories/tools/rename-category.tool';
import { CategoryNotFoundError } from '~/categories/domain/errors/category-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const CATEGORY_ID = 'b4b1c1e0-0000-4000-8000-000000000003';

const buildTool = () => {
  const renameCategory = { execute: jest.fn() };
  const tool = new RenameCategoryTool(renameCategory as never);
  return { tool, renameCategory };
};

describe('RenameCategoryTool', () => {
  it('renames the category and returns the fresh snapshot', async () => {
    const { tool, renameCategory } = buildTool();
    const renamed = { id: CATEGORY_ID, userId: 'user-1', name: 'Novo' };
    renameCategory.execute.mockResolvedValue(renamed);

    const result = await tool.execute({ id: CATEGORY_ID, name: 'Novo' }, CTX);

    expect(result).toEqual({ ok: true, data: renamed });
    expect(renameCategory.execute).toHaveBeenCalledWith({
      id: CATEGORY_ID,
      userId: 'user-1',
      name: 'Novo',
    });
  });

  it('returns ok:false when trying to rename a global or unowned category', async () => {
    const { tool, renameCategory } = buildTool();
    renameCategory.execute.mockRejectedValue(
      new CategoryNotFoundError(CATEGORY_ID),
    );

    const result = await tool.execute({ id: CATEGORY_ID, name: 'x' }, CTX);

    expect(result.ok).toBe(false);
  });
});
