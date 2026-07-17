import { ListTransactionsUseCase } from '~/transactions/application/use-cases/list-transactions.use-case';
import { TransactionType } from '~/transactions/domain/constants/transaction-type';

const buildUseCase = () => {
  const transactions = { list: jest.fn() };
  const useCase = new ListTransactionsUseCase(transactions);
  return { useCase, transactions };
};

describe('ListTransactionsUseCase', () => {
  it('forwards filters (with userId injected) to the repository', async () => {
    const { useCase, transactions } = buildUseCase();
    const rows = [
      {
        id: 't-1',
        userId: 'user-1',
        accountId: 'acc-1',
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: 25,
        description: 'Café',
        occurredAt: new Date('2026-07-15T10:00:00Z'),
      },
    ];
    transactions.list.mockResolvedValue(rows);

    const result = await useCase.execute({
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00Z'),
      dateTo: new Date('2026-07-31T23:59:59Z'),
      types: [TransactionType.Expense],
      limit: 50,
      offset: 0,
    });

    expect(result).toEqual(rows);
    expect(transactions.list).toHaveBeenCalledWith({
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00Z'),
      dateTo: new Date('2026-07-31T23:59:59Z'),
      types: [TransactionType.Expense],
      limit: 50,
      offset: 0,
    });
  });
});
