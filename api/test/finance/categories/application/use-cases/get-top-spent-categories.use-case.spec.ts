import { GetTopSpentCategoriesUseCase } from '~/finance/categories/application/use-cases/get-top-spent-categories.use-case';
import type { TopSpentCategory } from '~/finance/categories/domain/ports/categories-repository';

describe('GetTopSpentCategoriesUseCase', () => {
  it('forwards input to repository and returns the top rows as-is', async () => {
    const repo = { getTopSpentInMonth: jest.fn() };
    const useCase = new GetTopSpentCategoriesUseCase(repo as never);
    const dateFrom = new Date('2026-08-01T00:00:00Z');
    const dateTo = new Date('2026-09-01T00:00:00Z');
    const rows: TopSpentCategory[] = [
      {
        id: 'c-1',
        name: 'Food',
        icon: '🍔',
        color: '#ff0',
        spent: 300,
        share: 0.2,
      },
      {
        id: 'c-2',
        name: 'Rent',
        icon: null,
        color: null,
        spent: 1200,
        share: 0.8,
      },
    ];
    repo.getTopSpentInMonth.mockResolvedValue(rows);

    const result = await useCase.execute({
      userId: 'user-1',
      dateFrom,
      dateTo,
      limit: 5,
    });

    expect(result).toBe(rows);
    expect(repo.getTopSpentInMonth).toHaveBeenCalledWith({
      userId: 'user-1',
      dateFrom,
      dateTo,
      limit: 5,
    });
  });
});
