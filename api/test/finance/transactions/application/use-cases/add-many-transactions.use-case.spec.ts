import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { AddManyTransactionsUseCase } from '~/finance/transactions/application/use-cases/add-many-transactions.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

const USER_ID = 'user-1';
const HYBRID_ID = 'hybrid-1';
const DEBIT_ID = 'debit-1';
const OCCURRED = new Date('2026-07-15T12:00:00Z');

const hybridAccount = {
  id: HYBRID_ID,
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
  const useCase = new AddManyTransactionsUseCase(
    transactions as never,
    getAccount as never,
  );
  return { useCase, transactions, getAccount };
};

describe('AddManyTransactionsUseCase (debit-only)', () => {
  it('validates every referenced account exists and forwards the batch as-is', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockImplementation(({ id }: { id: string }) =>
      Promise.resolve(id === HYBRID_ID ? hybridAccount : debitAccount),
    );
    transactions.addMany.mockResolvedValue([{ id: 't-1' }, { id: 't-2' }]);

    const inputs = [
      {
        userId: USER_ID,
        accountId: HYBRID_ID,
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

    // MNT-230: no invoice resolution, no invoiceId enrichment; batch forwarded as-is.
    expect(transactions.addMany).toHaveBeenCalledWith(inputs);
  });

  it('caches account lookups by accountId across the batch', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(debitAccount);
    transactions.addMany.mockResolvedValue([]);

    await useCase.execute([
      {
        userId: USER_ID,
        accountId: DEBIT_ID,
        type: TransactionType.Expense,
        amount: 10,
        occurredAt: OCCURRED,
      },
      {
        userId: USER_ID,
        accountId: DEBIT_ID,
        type: TransactionType.Expense,
        amount: 20,
        occurredAt: OCCURRED,
      },
    ]);

    expect(getAccount.execute).toHaveBeenCalledTimes(1);
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
