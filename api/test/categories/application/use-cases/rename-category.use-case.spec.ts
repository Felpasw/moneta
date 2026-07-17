import { RenameCategoryUseCase } from '~/categories/application/use-cases/rename-category.use-case';
import { CategoryNotFoundError } from '~/categories/domain/errors/category-not-found.error';

const buildUseCase = () => {
  const categories = { rename: jest.fn() };
  const useCase = new RenameCategoryUseCase(categories);
  return { useCase, categories };
};

describe('RenameCategoryUseCase', () => {
  it('renames a custom category owned by the user and returns the fresh snapshot', async () => {
    const { useCase, categories } = buildUseCase();
    const renamed = {
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros novos',
      icon: null,
      color: null,
    };
    categories.rename.mockResolvedValue(renamed);

    const result = await useCase.execute({
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros novos',
    });

    expect(result).toEqual(renamed);
    expect(categories.rename).toHaveBeenCalledWith({
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros novos',
    });
  });

  it('throws CategoryNotFoundError when the repo returns null (global category or not owned)', async () => {
    const { useCase, categories } = buildUseCase();
    categories.rename.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'g-1', userId: 'user-1', name: 'x' }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});
