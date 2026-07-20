import { DeleteCategoryTool } from '~/agent/tools/categories/delete-category.tool';
import { CategoryNotFoundError } from '~/finance/categories/domain/errors/category-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const CATEGORY_ID = 'b4b1c1e0-0000-4000-8000-000000000003';

const buildTool = () => {
  const deleteCategory = { execute: jest.fn() };
  const tool = new DeleteCategoryTool(deleteCategory as never);
  return { tool, deleteCategory };
};

describe('DeleteCategoryTool', () => {
  it('deletes a custom category and confirms with ok:true', async () => {
    const { tool, deleteCategory } = buildTool();
    deleteCategory.execute.mockResolvedValue(undefined);

    const result = await tool.execute({ id: CATEGORY_ID }, CTX);

    expect(result).toEqual({
      ok: true,
      data: { id: CATEGORY_ID, deleted: true },
    });
    expect(deleteCategory.execute).toHaveBeenCalledWith({
      id: CATEGORY_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:false when trying to delete a global or unowned category', async () => {
    const { tool, deleteCategory } = buildTool();
    deleteCategory.execute.mockRejectedValue(
      new CategoryNotFoundError(CATEGORY_ID),
    );

    const result = await tool.execute({ id: CATEGORY_ID }, CTX);

    expect(result.ok).toBe(false);
  });
});
