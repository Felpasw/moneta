import { DeleteTransactionUseCase } from '~/transactions/application/use-cases/delete-transaction.use-case';
import { TransactionNotFoundError } from '~/transactions/domain/errors/transaction-not-found.error';

const buildUseCase = () => {
  const transactions = { delete: jest.fn() };
  const useCase = new DeleteTransactionUseCase(transactions);
  return { useCase, transactions };
};

describe('DeleteTransactionUseCase', () => {
  it('deletes the transaction owned by the user', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.delete.mockResolvedValue(undefined);

    await useCase.execute({ id: 't-1', userId: 'user-1' });

    expect(transactions.delete).toHaveBeenCalledWith('t-1', 'user-1');
  });

  it('propagates TransactionNotFoundError from the repository', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.delete.mockRejectedValue(new TransactionNotFoundError('t-1'));

    await expect(
      useCase.execute({ id: 't-1', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });
});
