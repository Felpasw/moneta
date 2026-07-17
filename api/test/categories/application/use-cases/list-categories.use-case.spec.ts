import { ListCategoriesUseCase } from '~/categories/application/use-cases/list-categories.use-case';
import type { Category } from '~/categories/domain/ports/categories-repository';

const buildUseCase = () => {
  const categories = { listForUser: jest.fn() };
  const useCase = new ListCategoriesUseCase(categories);
  return { useCase, categories };
};

describe('ListCategoriesUseCase', () => {
  it('returns globals + custom categories for the given user', async () => {
    const { useCase, categories } = buildUseCase();
    const rows: Category[] = [
      {
        id: 'g-1',
        userId: null,
        name: 'Alimentação',
        icon: null,
        color: null,
      },
      {
        id: 'c-1',
        userId: 'user-1',
        name: 'Cafés especiais',
        icon: null,
        color: null,
      },
    ];
    categories.listForUser.mockResolvedValue(rows);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual(rows);
    expect(categories.listForUser).toHaveBeenCalledWith('user-1');
  });
});
