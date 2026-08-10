import { ListTransactionsUseCase } from '~/finance/transactions/application/use-cases/list-transactions.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import type {
  TransactionWithEmbeds,
  TransactionsSummary,
} from '~/finance/transactions/domain/ports/transactions-repository';

const buildUseCase = () => {
  const transactions = { list: jest.fn(), summarize: jest.fn() };
  const useCase = new ListTransactionsUseCase(transactions);
  return { useCase, transactions };
};

const account = {
  id: 'acc-1',
  nickname: 'Main',
  bankName: 'Nubank',
};

const expense = (id: string, amount: number): TransactionWithEmbeds => ({
  id,
  userId: 'user-1',
  accountId: 'acc-1',
  categoryId: null,
  invoiceId: null,
  type: TransactionType.Expense,
  amount,
  description: null,
  occurredAt: new Date('2026-07-15T10:00:00Z'),
  account,
  category: null,
  signedAmount: -amount,
  dayGroupKey: '2026-07-15',
});

const income = (id: string, amount: number): TransactionWithEmbeds => ({
  id,
  userId: 'user-1',
  accountId: 'acc-1',
  categoryId: null,
  invoiceId: null,
  type: TransactionType.Income,
  amount,
  description: null,
  occurredAt: new Date('2026-07-15T10:00:00Z'),
  account,
  category: null,
  signedAmount: amount,
  dayGroupKey: '2026-07-15',
});

describe('ListTransactionsUseCase', () => {
  it('forwards filters (with userId injected) to list and summarize in parallel', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.list.mockResolvedValue([]);
    transactions.summarize.mockResolvedValue({
      totalIncome: 0,
      totalExpense: 0,
      net: 0,
    });

    const filters = {
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00Z'),
      dateTo: new Date('2026-07-31T23:59:59Z'),
      types: [TransactionType.Expense],
      limit: 50,
      offset: 0,
    };

    await useCase.execute(filters);

    expect(transactions.list).toHaveBeenCalledWith(filters);
    expect(transactions.summarize).toHaveBeenCalledWith(filters);
  });

  it('returns items from list + summary from summarize', async () => {
    const { useCase, transactions } = buildUseCase();
    const items = [
      income('t-1', 2000),
      expense('t-2', 120.5),
      expense('t-3', 300),
    ];
    const summary: TransactionsSummary = {
      totalIncome: 2000,
      totalExpense: 420.5,
      net: 1579.5,
    };
    transactions.list.mockResolvedValue(items);
    transactions.summarize.mockResolvedValue(summary);

    const result = await useCase.execute({
      userId: 'user-1',
      limit: 50,
      offset: 0,
    });

    expect(result).toEqual({ items, summary });
  });

  it('runs list and summarize queries in parallel', async () => {
    const { useCase, transactions } = buildUseCase();
    const order: string[] = [];
    transactions.list.mockImplementation(async () => {
      order.push('items-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('items-end');
      return [];
    });
    transactions.summarize.mockImplementation(async () => {
      order.push('summary-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('summary-end');
      return { totalIncome: 0, totalExpense: 0, net: 0 };
    });

    await useCase.execute({
      userId: 'user-1',
      limit: 50,
      offset: 0,
    });

    expect(order.slice(0, 2).sort()).toEqual(['items-start', 'summary-start']);
  });
});
