import { GetDashboardViewUseCase } from '~/dashboard/application/use-cases/get-dashboard-view.use-case';

const emptyFlow = { rows: [], maxFlow: '0.00' };
const emptyChart = {
  points: [],
  min: '0.00',
  max: '0.00',
  linePath: '',
  areaPath: '',
  lastPoint: null,
};

const buildUseCase = () => {
  const listAccounts = { execute: jest.fn() };
  const listTransactions = { execute: jest.fn() };
  const getTopCategories = { execute: jest.fn().mockResolvedValue([]) };
  const getMonthlyFlow = { execute: jest.fn().mockResolvedValue(emptyFlow) };
  const getBalanceChart = { execute: jest.fn().mockResolvedValue(emptyChart) };
  const clock = { now: jest.fn() };
  const useCase = new GetDashboardViewUseCase(
    clock,
    listAccounts as never,
    listTransactions as never,
    getTopCategories as never,
    getMonthlyFlow as never,
    getBalanceChart as never,
  );
  return {
    useCase,
    listAccounts,
    listTransactions,
    getTopCategories,
    getMonthlyFlow,
    getBalanceChart,
    clock,
  };
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
  it('returns summary with monetary fields as strings from accounts + transactions', async () => {
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
        totalBalance: '5432.10',
        checkingCount: 3,
        monthIncome: '8000.00',
        monthExpense: '3210.50',
        monthNet: '4789.50',
      },
      topCategories: [],
      monthlyFlow: emptyFlow,
      balanceChart: emptyChart,
    });
  });

  it('returns balanceChart straight from the repo (points with precomputed y + min/max)', async () => {
    const { useCase, listAccounts, listTransactions, getBalanceChart, clock } =
      buildUseCase();
    clock.now.mockReturnValue(new Date('2026-08-15T12:00:00Z'));
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue(emptyTransactionsResult);
    const chart = {
      points: [
        { date: '2026-07-17', balance: '4000.00' },
        { date: '2026-07-18', balance: '3900.55' },
      ],
      min: '3900.55',
      max: '4000.00',
      linePath: 'M 0 0 L 100 40',
      areaPath: 'M 0 0 L 100 40 L 100 40 L 0 40 Z',
      lastPoint: { x: 100, y: 40 },
    };
    getBalanceChart.execute.mockResolvedValue(chart);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.balanceChart).toBe(chart);
  });

  it('scopes balance chart to last 30 days from Clock', async () => {
    const { useCase, listAccounts, listTransactions, getBalanceChart, clock } =
      buildUseCase();
    const now = new Date('2026-08-15T12:00:00Z');
    clock.now.mockReturnValue(now);
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue(emptyTransactionsResult);

    await useCase.execute({ userId: 'user-1' });

    expect(getBalanceChart.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      now,
      days: 30,
    });
  });

  it('returns monthlyFlow straight from the repo (rows+maxFlow)', async () => {
    const { useCase, listAccounts, listTransactions, getMonthlyFlow, clock } =
      buildUseCase();
    clock.now.mockReturnValue(new Date('2026-08-15T12:00:00Z'));
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue(emptyTransactionsResult);
    const flow = {
      rows: [
        {
          monthKey: '2026-03',
          income: '3000.00',
          expense: '1200.00',
          incomePct: 93.73,
          expensePct: 37.49,
        },
        {
          monthKey: '2026-04',
          income: '3200.55',
          expense: '900.10',
          incomePct: 100,
          expensePct: 28.12,
        },
      ],
      maxFlow: '3200.55',
    };
    getMonthlyFlow.execute.mockResolvedValue(flow);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.monthlyFlow).toBe(flow);
  });

  it('scopes monthly flow to last 6 months from Clock', async () => {
    const { useCase, listAccounts, listTransactions, getMonthlyFlow, clock } =
      buildUseCase();
    const now = new Date('2026-08-15T12:00:00Z');
    clock.now.mockReturnValue(now);
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue(emptyTransactionsResult);

    await useCase.execute({ userId: 'user-1' });

    expect(getMonthlyFlow.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      now,
      monthsBack: 6,
    });
  });

  it('returns topCategories straight from the repo (sharePct 0..100, spent string precomputed in SQL)', async () => {
    const { useCase, listAccounts, listTransactions, getTopCategories, clock } =
      buildUseCase();
    clock.now.mockReturnValue(new Date('2026-08-15T12:00:00Z'));
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue({
      items: [],
      summary: { totalIncome: 0, totalExpense: 1000, net: -1000 },
    });
    const topRows = [
      {
        id: 'c-1',
        name: 'Food',
        icon: '🍔',
        color: '#f00',
        spent: '400.00',
        sharePct: 40,
      },
      {
        id: 'c-2',
        name: 'Rent',
        icon: null,
        color: null,
        spent: '250.00',
        sharePct: 25,
      },
    ];
    getTopCategories.execute.mockResolvedValue(topRows);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.topCategories).toBe(topRows);
  });

  it('scopes top categories to same month bounds with limit=5', async () => {
    const { useCase, listAccounts, listTransactions, getTopCategories, clock } =
      buildUseCase();
    clock.now.mockReturnValue(new Date('2026-08-15T12:00:00Z'));
    listAccounts.execute.mockResolvedValue(emptyAccountsResult);
    listTransactions.execute.mockResolvedValue(emptyTransactionsResult);

    await useCase.execute({ userId: 'user-1' });

    expect(getTopCategories.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      dateFrom: new Date(Date.UTC(2026, 7, 1)),
      dateTo: new Date(Date.UTC(2026, 8, 1)),
      limit: 5,
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

  it('runs all five data sources in parallel', async () => {
    const {
      useCase,
      listAccounts,
      listTransactions,
      getTopCategories,
      getMonthlyFlow,
      getBalanceChart,
      clock,
    } = buildUseCase();
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
    getTopCategories.execute.mockImplementation(async () => {
      order.push('top-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('top-end');
      return [];
    });
    getMonthlyFlow.execute.mockImplementation(async () => {
      order.push('flow-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('flow-end');
      return emptyFlow;
    });
    getBalanceChart.execute.mockImplementation(async () => {
      order.push('chart-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('chart-end');
      return emptyChart;
    });

    await useCase.execute({ userId: 'user-1' });

    expect(order.slice(0, 5).sort()).toEqual([
      'accounts-start',
      'chart-start',
      'flow-start',
      'top-start',
      'transactions-start',
    ]);
  });
});
