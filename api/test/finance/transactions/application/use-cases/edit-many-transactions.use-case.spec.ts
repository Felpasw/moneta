import { EditManyTransactionsUseCase } from '~/finance/transactions/application/use-cases/edit-many-transactions.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { TransactionNotFoundError } from '~/finance/transactions/domain/errors/transaction-not-found.error';

const USER_ID = 'user-1';
const DEBIT_ID = 'debit-1';
const CARD_ID = 'card-1';

const debit = {
  id: DEBIT_ID,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Corrente',
  balance: 500,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
};
const card = {
  id: CARD_ID,
  userId: USER_ID,
  bankId: 'b-2',
  nickname: 'Nubank',
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 10,
  dueDay: 20,
};

const currentTx = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  userId: USER_ID,
  accountId: DEBIT_ID,
  categoryId: null,
  invoiceId: null,
  type: TransactionType.Expense,
  amount: 30,
  description: null,
  occurredAt: new Date('2026-07-15T12:00:00Z'),
  ...overrides,
});

const buildUseCase = () => {
  const transactions = { editMany: jest.fn(), findById: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const cycle = { resolveInvoiceForDate: jest.fn() };
  const useCase = new EditManyTransactionsUseCase(
    transactions as never,
    getAccount as never,
    cycle as never,
  );
  return { useCase, transactions, getAccount, cycle };
};

describe('EditManyTransactionsUseCase', () => {
  it('enriches each edit with the resolved newInvoiceId and forwards the batch', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    transactions.findById
      .mockResolvedValueOnce(
        currentTx('t-1', { accountId: CARD_ID, invoiceId: 'inv-x' }),
      )
      .mockResolvedValueOnce(currentTx('t-2'));
    getAccount.execute.mockImplementation(({ id }: { id: string }) =>
      Promise.resolve(id === CARD_ID ? card : debit),
    );
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-x' });
    transactions.editMany.mockResolvedValue([{ id: 't-1' }, { id: 't-2' }]);

    await useCase.execute([
      { id: 't-1', userId: USER_ID, amount: 45 },
      { id: 't-2', userId: USER_ID, categoryId: 'cat-1' },
    ]);

    expect(transactions.editMany).toHaveBeenCalledWith([
      { id: 't-1', userId: USER_ID, amount: 45, newInvoiceId: 'inv-x' },
      { id: 't-2', userId: USER_ID, categoryId: 'cat-1', newInvoiceId: null },
    ]);
  });

  it('throws TransactionNotFoundError early when any target is missing', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute([{ id: 'ghost', userId: USER_ID, amount: 10 }]),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
    expect(transactions.editMany).not.toHaveBeenCalled();
  });
});
