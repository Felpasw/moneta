import { EditManyTransactionsUseCase } from '~/transactions/application/use-cases/edit-many-transactions.use-case';
import { TransactionNotFoundError } from '~/transactions/domain/errors/transaction-not-found.error';

const buildUseCase = () => {
  const transactions = { editMany: jest.fn() };
  const useCase = new EditManyTransactionsUseCase(transactions);
  return { useCase, transactions };
};

describe('EditManyTransactionsUseCase', () => {
  it('edits all transactions in a single atomic batch', async () => {
    const { useCase, transactions } = buildUseCase();
    const inputs = [
      { id: 't-1', userId: 'user-1', amount: 55 },
      { id: 't-2', userId: 'user-1', categoryId: 'cat-1' },
    ];
    const updated = inputs.map((i) => ({ ...i, accountId: 'acc-1' }));
    transactions.editMany.mockResolvedValue(updated);

    const result = await useCase.execute(inputs);

    expect(result).toEqual(updated);
    expect(transactions.editMany).toHaveBeenCalledWith(inputs);
  });

  it('propagates TransactionNotFoundError when any target is missing', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.editMany.mockRejectedValue(
      new TransactionNotFoundError('t-x'),
    );

    await expect(
      useCase.execute([{ id: 't-x', userId: 'user-1', amount: 10 }]),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });
});
