import { GetBalanceChartUseCase } from '~/finance/accounts/application/use-cases/get-balance-chart.use-case';
import type { BalanceChartPoint } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';

describe('GetBalanceChartUseCase', () => {
  it('forwards input to repository and returns the rows as-is', async () => {
    const repo = { getBalanceChart: jest.fn() };
    const useCase = new GetBalanceChartUseCase(repo as never);
    const now = new Date('2026-08-15T12:00:00Z');
    const rows: BalanceChartPoint[] = [
      { date: '2026-07-17', balance: 4000 },
      { date: '2026-07-18', balance: 3900 },
    ];
    repo.getBalanceChart.mockResolvedValue(rows);

    const result = await useCase.execute({
      userId: 'user-1',
      now,
      days: 30,
    });

    expect(result).toBe(rows);
    expect(repo.getBalanceChart).toHaveBeenCalledWith({
      userId: 'user-1',
      now,
      days: 30,
    });
  });
});
