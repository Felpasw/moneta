import { AddCategoryUseCase } from '~/categories/application/use-cases/add-category.use-case';

const buildUseCase = () => {
  const categories = { addCustom: jest.fn() };
  const useCase = new AddCategoryUseCase(categories);
  return { useCase, categories };
};

describe('AddCategoryUseCase', () => {
  it('creates a custom category owned by the user and returns it', async () => {
    const { useCase, categories } = buildUseCase();
    const created = {
      id: 'c-1',
      userId: 'user-1',
      name: 'Livros',
      icon: null,
      color: null,
    };
    categories.addCustom.mockResolvedValue(created);

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Livros',
    });

    expect(result).toEqual(created);
    expect(categories.addCustom).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Livros',
    });
  });

  it('forwards optional icon and color to the repository', async () => {
    const { useCase, categories } = buildUseCase();
    categories.addCustom.mockResolvedValue({});

    await useCase.execute({
      userId: 'user-1',
      name: 'Streaming',
      icon: 'tv',
      color: '#ff00aa',
    });

    expect(categories.addCustom).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Streaming',
      icon: 'tv',
      color: '#ff00aa',
    });
  });
});
