import { UpdateCategoryTool } from '~/agent/tools/categories/update-category.tool';
import { CategoryNotFoundError } from '~/finance/categories/domain/errors/category-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const CATEGORY_ID = 'b4b1c1e0-0000-4000-8000-000000000003';

const buildTool = () => {
  const updateCategory = { execute: jest.fn() };
  const tool = new UpdateCategoryTool(updateCategory as never);
  return { tool, updateCategory };
};

describe('UpdateCategoryTool', () => {
  it('updates the category and returns the fresh snapshot', async () => {
    const { tool, updateCategory } = buildTool();
    const updated = {
      id: CATEGORY_ID,
      userId: 'user-1',
      name: 'Novo',
      icon: null,
      color: null,
      monthlyBudget: 200,
    };
    updateCategory.execute.mockResolvedValue(updated);

    const result = await tool.execute(
      { id: CATEGORY_ID, name: 'Novo', monthlyBudget: 200 },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: updated });
    expect(updateCategory.execute).toHaveBeenCalledWith({
      id: CATEGORY_ID,
      userId: 'user-1',
      name: 'Novo',
      icon: undefined,
      color: undefined,
      monthlyBudget: 200,
    });
  });

  it('rejects input without any field to update', async () => {
    const { tool } = buildTool();

    const result = await tool.execute({ id: CATEGORY_ID }, CTX);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('At least one field must be provided');
  });

  it('accepts null to clear monthlyBudget explicitly', async () => {
    const { tool, updateCategory } = buildTool();
    updateCategory.execute.mockResolvedValue({
      id: CATEGORY_ID,
      userId: 'user-1',
      name: 'Books',
      icon: null,
      color: null,
      monthlyBudget: null,
    });

    await tool.execute({ id: CATEGORY_ID, monthlyBudget: null }, CTX);

    expect(updateCategory.execute).toHaveBeenCalledWith({
      id: CATEGORY_ID,
      userId: 'user-1',
      name: undefined,
      icon: undefined,
      color: undefined,
      monthlyBudget: null,
    });
  });

  it('returns ok:false when trying to update a global or unowned category', async () => {
    const { tool, updateCategory } = buildTool();
    updateCategory.execute.mockRejectedValue(
      new CategoryNotFoundError(CATEGORY_ID),
    );

    const result = await tool.execute({ id: CATEGORY_ID, name: 'x' }, CTX);

    expect(result.ok).toBe(false);
  });
});
