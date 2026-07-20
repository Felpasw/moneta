import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { AddManyTransactionsUseCase } from '~/finance/transactions/application/use-cases/add-many-transactions.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

const USER_ID = 'user-1';
const CARD_ID = 'card-1';
const DEBIT_ID = 'debit-1';
const OCCURRED = new Date('2026-07-15T12:00:00Z');

const cardAccount = {
  id: CARD_ID,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Nubank',
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 10,
  dueDay: 20,
};

const debitAccount = {
  id: DEBIT_ID,
  userId: USER_ID,
  bankId: 'b-2',
  nickname: 'Corrente',
  balance: 1000,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
};

const buildUseCase = () => {
  const transactions = { addMany: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const cycle = { resolveInvoiceForDate: jest.fn() };
  const useCase = new AddManyTransactionsUseCase(
    transactions as never,
    getAccount as never,
    cycle as never,
  );
  return { useCase, transactions, getAccount, cycle };
};

describe('AddManyTransactionsUseCase', () => {
  it('resolves invoice per-item and forwards the enriched batch to the repo', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockImplementation(({ id }: { id: string }) =>
      Promise.resolve(id === CARD_ID ? cardAccount : debitAccount),
    );
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-1' });
    transactions.addMany.mockResolvedValue([{ id: 't-1' }, { id: 't-2' }]);

    const inputs = [
      {
        userId: USER_ID,
        accountId: CARD_ID,
        type: TransactionType.Expense,
        amount: 50,
        occurredAt: OCCURRED,
      },
      {
        userId: USER_ID,
        accountId: DEBIT_ID,
        type: TransactionType.Expense,
        amount: 30,
        occurredAt: OCCURRED,
      },
    ];

    await useCase.execute(inputs);

    expect(cycle.resolveInvoiceForDate).toHaveBeenCalledTimes(1);
    expect(transactions.addMany).toHaveBeenCalledWith([
      { ...inputs[0], invoiceId: 'inv-1' },
      inputs[1],
    ]);
  });

  it('throws AccountNotFoundError as soon as any item points to a missing account', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValueOnce(debitAccount);
    getAccount.execute.mockResolvedValueOnce(null);

    await expect(
      useCase.execute([
        {
          userId: USER_ID,
          accountId: DEBIT_ID,
          type: TransactionType.Expense,
          amount: 10,
          occurredAt: OCCURRED,
        },
        {
          userId: USER_ID,
          accountId: 'ghost',
          type: TransactionType.Expense,
          amount: 20,
          occurredAt: OCCURRED,
        },
      ]),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
    expect(transactions.addMany).not.toHaveBeenCalled();
  });
});
