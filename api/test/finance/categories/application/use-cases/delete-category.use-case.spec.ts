import { DeleteCategoryUseCase } from '~/finance/categories/application/use-cases/delete-category.use-case';
import { CategoryNotFoundError } from '~/finance/categories/domain/errors/category-not-found.error';

const buildUseCase = () => {
  const categories = { delete: jest.fn() };
  const useCase = new DeleteCategoryUseCase(categories);
  return { useCase, categories };
};

describe('DeleteCategoryUseCase', () => {
  it('deletes a custom category owned by the user', async () => {
    const { useCase, categories } = buildUseCase();
    categories.delete.mockResolvedValue(true);

    await useCase.execute({ id: 'c-1', userId: 'user-1' });

    expect(categories.delete).toHaveBeenCalledWith('c-1', 'user-1');
  });

  it('throws CategoryNotFoundError when the repo reports nothing deleted', async () => {
    const { useCase, categories } = buildUseCase();
    categories.delete.mockResolvedValue(false);

    await expect(
      useCase.execute({ id: 'g-1', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});
