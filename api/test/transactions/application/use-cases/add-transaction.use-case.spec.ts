import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';
import { AddTransactionUseCase } from '~/transactions/application/use-cases/add-transaction.use-case';
import { TransactionType } from '~/transactions/domain/constants/transaction-type';

const buildUseCase = () => {
  const transactions = { add: jest.fn() };
  const useCase = new AddTransactionUseCase(transactions);
  return { useCase, transactions };
};

const BASE_INPUT = {
  userId: 'user-1',
  accountId: 'acc-1',
  type: TransactionType.Expense,
  amount: 42.5,
  occurredAt: new Date('2026-07-15T12:00:00Z'),
};

describe('AddTransactionUseCase', () => {
  it('creates a transaction and returns the record', async () => {
    const { useCase, transactions } = buildUseCase();
    const created = { id: 't-1', ...BASE_INPUT };
    transactions.add.mockResolvedValue(created);

    const result = await useCase.execute(BASE_INPUT);

    expect(result).toEqual(created);
    expect(transactions.add).toHaveBeenCalledWith(BASE_INPUT);
  });

  it('propagates AccountNotFoundError from the repository', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.add.mockRejectedValue(new AccountNotFoundError('acc-1'));

    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
  });
});
