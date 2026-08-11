import { GetDashboardViewUseCase } from '~/dashboard/application/use-cases/get-dashboard-view.use-case';

const buildUseCase = () => {
  const listAccounts = { execute: jest.fn() };
  const listTransactions = { execute: jest.fn() };
  const clock = { now: jest.fn() };
  const useCase = new GetDashboardViewUseCase(
    clock,
    listAccounts as never,
    listTransactions as never,
  );
  return { useCase, listAccounts, listTransactions, clock };
};

const emptyAccountsResult = {
  items: [],
  summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
};

const emptyTransactionsResult = {
  items: [],
  summary: { totalIncome: 0, totalExpense: 0, net: 0 },
};

describe('GetDashboardViewUseCase', () => {
  it('returns summary with totalBalance from accounts + month totals from transactions', async () => {
    const { useCase, listAccounts, listTransactions, clock } = buildUseCase();
    clock.now.mockReturnValue(new Date('2026-08-15T12:00:00Z'));
    listAccounts.execute.mockResolvedValue({
      items: [],
      summary: {
        totalBalance: 5432.1,
        checkingCount: 3,
        totalOverdraft: 500,
      },
    });
    listTransactions.execute.mockResolvedValue({
      items: [],
      summary: {
        totalIncome: 8000,
        totalExpense: 3210.5,
        net: 4789.5,
      },
    });

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({
      summary: {
        totalBalance: 5432.1,
        monthIncome: 8000,
        monthExpense: 3210.5,
        monthNet: 4789.5,
      },
    });
  });

  it('scopes transactions summary to current month bounds derived from Clock', async () => {
    const { useCase, listAccounts, listTransactions, clock } = buildUseCase();
    clock.now.mockReturnValue(new Date('2026-08-15T12:00:00Z'));
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue(emptyTransactionsResult);

    await useCase.execute({ userId: 'user-1' });

    expect(listTransactions.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        dateFrom: new Date(Date.UTC(2026, 7, 1)),
        dateTo: new Date(Date.UTC(2026, 8, 1)),
      }),
    );
  });

  it('handles month rollover (December → January bounds)', async () => {
    const { useCase, listAccounts, listTransactions, clock } = buildUseCase();
    clock.now.mockReturnValue(new Date('2026-12-31T23:59:59Z'));
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue(emptyTransactionsResult);

    await useCase.execute({ userId: 'user-1' });

    expect(listTransactions.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: new Date(Date.UTC(2026, 11, 1)),
        dateTo: new Date(Date.UTC(2027, 0, 1)),
      }),
    );
  });

  it('runs accounts and transactions summaries in parallel', async () => {
    const { useCase, listAccounts, listTransactions, clock } = buildUseCase();
    clock.now.mockReturnValue(new Date('2026-08-15T12:00:00Z'));
    const order: string[] = [];
    listAccounts.execute.mockImplementation(async () => {
      order.push('accounts-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('accounts-end');
      return emptyAccountsResult;
    });
    listTransactions.execute.mockImplementation(async () => {
      order.push('transactions-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('transactions-end');
      return emptyTransactionsResult;
    });

    await useCase.execute({ userId: 'user-1' });

    expect(order.slice(0, 2).sort()).toEqual([
      'accounts-start',
      'transactions-start',
    ]);
  });
});
