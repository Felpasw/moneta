import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { AddManyTransactionsUseCase } from '~/finance/transactions/application/use-cases/add-many-transactions.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

const buildUseCase = () => {
  const transactions = { addMany: jest.fn() };
  const useCase = new AddManyTransactionsUseCase(transactions);
  return { useCase, transactions };
};

const OCCURRED = new Date('2026-07-15T12:00:00Z');

describe('AddManyTransactionsUseCase', () => {
  it('creates all transactions and returns them in order', async () => {
    const { useCase, transactions } = buildUseCase();
    const inputs = [
      {
        userId: 'user-1',
        accountId: 'acc-1',
        type: TransactionType.Expense,
        amount: 10,
        occurredAt: OCCURRED,
      },
      {
        userId: 'user-1',
        accountId: 'acc-1',
        type: TransactionType.Expense,
        amount: 25,
        occurredAt: OCCURRED,
      },
    ];
    const created = inputs.map((i, idx) => ({ id: `t-${idx}`, ...i }));
    transactions.addMany.mockResolvedValue(created);

    const result = await useCase.execute(inputs);

    expect(result).toEqual(created);
    expect(transactions.addMany).toHaveBeenCalledWith(inputs);
  });

  it('propagates AccountNotFoundError from the atomic batch', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.addMany.mockRejectedValue(new AccountNotFoundError('acc-x'));

    await expect(
      useCase.execute([
        {
          userId: 'user-1',
          accountId: 'acc-x',
          type: TransactionType.Expense,
          amount: 10,
          occurredAt: OCCURRED,
        },
      ]),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
