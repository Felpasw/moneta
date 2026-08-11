import { UpdateCategoryUseCase } from '~/finance/categories/application/use-cases/update-category.use-case';
import { CategoryNotFoundError } from '~/finance/categories/domain/errors/category-not-found.error';

const buildUseCase = () => {
  const categories = { update: jest.fn() };
  const useCase = new UpdateCategoryUseCase(categories);
  return { useCase, categories };
};

describe('UpdateCategoryUseCase', () => {
  it('updates a custom category owned by the user and returns the fresh snapshot', async () => {
    const { useCase, categories } = buildUseCase();
    const updated = {
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros novos',
      icon: null,
      color: null,
      monthlyBudget: 150,
    };
    categories.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros novos',
      monthlyBudget: 150,
    });

    expect(result).toEqual(updated);
    expect(categories.update).toHaveBeenCalledWith({
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros novos',
      monthlyBudget: 150,
    });
  });

  it('forwards partial patches (only name)', async () => {
    const { useCase, categories } = buildUseCase();
    categories.update.mockResolvedValue({
      id: 'c-1',
      userId: 'user-1',
      name: 'x',
      icon: null,
      color: null,
      monthlyBudget: null,
    });

    await useCase.execute({ id: 'c-1', userId: 'user-1', name: 'x' });

    expect(categories.update).toHaveBeenCalledWith({
      id: 'c-1',
      userId: 'user-1',
      name: 'x',
    });
  });

  it('accepts null to clear monthlyBudget explicitly', async () => {
    const { useCase, categories } = buildUseCase();
    categories.update.mockResolvedValue({
      id: 'c-1',
      userId: 'user-1',
      name: 'x',
      icon: null,
      color: null,
      monthlyBudget: null,
    });

    await useCase.execute({
      id: 'c-1',
      userId: 'user-1',
      monthlyBudget: null,
    });

    expect(categories.update).toHaveBeenCalledWith({
      id: 'c-1',
      userId: 'user-1',
      monthlyBudget: null,
    });
  });

  it('throws CategoryNotFoundError when the repo returns null (global category or not owned)', async () => {
    const { useCase, categories } = buildUseCase();
    categories.update.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'g-1', userId: 'user-1', name: 'x' }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});
