import { ListTransactionsUseCase } from '~/finance/transactions/application/use-cases/list-transactions.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import type { TransactionWithEmbeds } from '~/finance/transactions/domain/ports/transactions-repository';

const buildUseCase = () => {
  const transactions = { list: jest.fn() };
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
});

describe('ListTransactionsUseCase', () => {
  it('forwards filters (with userId injected) to the repository', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.list.mockResolvedValue([]);

    await useCase.execute({
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00Z'),
      dateTo: new Date('2026-07-31T23:59:59Z'),
      types: [TransactionType.Expense],
      limit: 50,
      offset: 0,
    });

    expect(transactions.list).toHaveBeenCalledWith({
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00Z'),
      dateTo: new Date('2026-07-31T23:59:59Z'),
      types: [TransactionType.Expense],
      limit: 50,
      offset: 0,
    });
  });

  it('returns items + summary aggregated over the filtered set', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.list.mockResolvedValue([
      income('t-1', 2000),
      expense('t-2', 120.5),
      expense('t-3', 300),
    ]);

    const result = await useCase.execute({
      userId: 'user-1',
      limit: 50,
      offset: 0,
    });

    expect(result.items).toHaveLength(3);
    expect(result.summary).toEqual({
      totalIncome: 2000,
      totalExpense: 420.5,
      net: 1579.5,
    });
  });

  it('returns a zero summary when there are no transactions', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.list.mockResolvedValue([]);

    const result = await useCase.execute({
      userId: 'user-1',
      limit: 50,
      offset: 0,
    });

    expect(result).toEqual({
      items: [],
      summary: { totalIncome: 0, totalExpense: 0, net: 0 },
    });
  });

  it('net can be negative when expenses exceed income', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.list.mockResolvedValue([
      income('t-1', 100),
      expense('t-2', 500),
    ]);

    const result = await useCase.execute({
      userId: 'user-1',
      limit: 50,
      offset: 0,
    });

    expect(result.summary).toEqual({
      totalIncome: 100,
      totalExpense: 500,
      net: -400,
    });
  });
});
