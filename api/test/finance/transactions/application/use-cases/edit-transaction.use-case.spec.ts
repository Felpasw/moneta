import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { EditTransactionUseCase } from '~/finance/transactions/application/use-cases/edit-transaction.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { TransactionNotFoundError } from '~/finance/transactions/domain/errors/transaction-not-found.error';

const buildUseCase = () => {
  const transactions = { edit: jest.fn() };
  const useCase = new EditTransactionUseCase(transactions);
  return { useCase, transactions };
};

describe('EditTransactionUseCase', () => {
  it('edits the transaction and returns the updated record', async () => {
    const { useCase, transactions } = buildUseCase();
    const updated = {
      id: 't-1',
      userId: 'user-1',
      accountId: 'acc-1',
      type: TransactionType.Expense,
      amount: 100,
    };
    transactions.edit.mockResolvedValue(updated);

    const result = await useCase.execute({
      id: 't-1',
      userId: 'user-1',
      amount: 100,
    });

    expect(result).toEqual(updated);
    expect(transactions.edit).toHaveBeenCalledWith({
      id: 't-1',
      userId: 'user-1',
      amount: 100,
    });
  });

  it('propagates TransactionNotFoundError from the repository', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.edit.mockRejectedValue(new TransactionNotFoundError('t-1'));

    await expect(
      useCase.execute({ id: 't-1', userId: 'user-1', amount: 10 }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('propagates AccountNotFoundError when moving to an account not owned', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.edit.mockRejectedValue(new AccountNotFoundError('acc-2'));

    await expect(
      useCase.execute({ id: 't-1', userId: 'user-1', accountId: 'acc-2' }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
