import { GetMonthlyFlowUseCase } from '~/finance/transactions/application/use-cases/get-monthly-flow.use-case';
import type { MonthlyFlowRow } from '~/finance/transactions/domain/ports/transactions-repository';

describe('GetMonthlyFlowUseCase', () => {
  it('forwards input to repository and returns the rows as-is', async () => {
    const repo = { getMonthlyFlow: jest.fn() };
    const useCase = new GetMonthlyFlowUseCase(repo as never);
    const now = new Date('2026-08-15T12:00:00Z');
    const rows: MonthlyFlowRow[] = [
      { monthKey: '2026-03', income: 3000, expense: 1200 },
      { monthKey: '2026-04', income: 3000, expense: 800 },
    ];
    repo.getMonthlyFlow.mockResolvedValue(rows);

    const result = await useCase.execute({
      userId: 'user-1',
      now,
      monthsBack: 6,
    });

    expect(result).toBe(rows);
    expect(repo.getMonthlyFlow).toHaveBeenCalledWith({
      userId: 'user-1',
      now,
      monthsBack: 6,
    });
  });
});
