import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { EditTransactionUseCase } from '~/finance/transactions/application/use-cases/edit-transaction.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { TransactionNotFoundError } from '~/finance/transactions/domain/errors/transaction-not-found.error';

const USER_ID = 'user-1';
const DEBIT_ID = 'debit-1';
const CARD_A = 'card-a';
const CARD_B = 'card-b';
const TX_ID = 't-1';

const debit = {
  id: DEBIT_ID,
  userId: USER_ID,
  bankId: 'b-0',
  nickname: 'Corrente',
  balance: 1000,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
};
const cardA = {
  id: CARD_A,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Nubank',
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 10,
  dueDay: 20,
};
const cardB = {
  id: CARD_B,
  userId: USER_ID,
  bankId: 'b-2',
  nickname: 'Itau',
  balance: 0,
  creditLimit: 3000,
  overdraftLimit: null,
  closeDay: 5,
  dueDay: 15,
};

const currentTx = (overrides: Record<string, unknown> = {}) => ({
  id: TX_ID,
  userId: USER_ID,
  accountId: DEBIT_ID,
  categoryId: null,
  invoiceId: null,
  type: TransactionType.Expense,
  amount: 50,
  description: null,
  occurredAt: new Date('2026-07-15T12:00:00Z'),
  ...overrides,
});

const buildUseCase = () => {
  const transactions = { edit: jest.fn(), findById: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const cycle = { resolveInvoiceForDate: jest.fn() };
  const useCase = new EditTransactionUseCase(
    transactions as never,
    getAccount as never,
    cycle as never,
  );
  return { useCase, transactions, getAccount, cycle };
};

describe('EditTransactionUseCase', () => {
  it('edits a debit transaction without touching invoice logic', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    transactions.findById.mockResolvedValue(currentTx());
    getAccount.execute.mockResolvedValue(debit);
    transactions.edit.mockResolvedValue({ id: TX_ID, amount: 100 });

    await useCase.execute({ id: TX_ID, userId: USER_ID, amount: 100 });

    expect(cycle.resolveInvoiceForDate).not.toHaveBeenCalled();
    expect(transactions.edit).toHaveBeenCalledWith({
      id: TX_ID,
      userId: USER_ID,
      amount: 100,
      newInvoiceId: null,
    });
  });

  it('resolves new invoice when the target account is a card (same card, same cycle)', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    transactions.findById.mockResolvedValue(
      currentTx({ accountId: CARD_A, invoiceId: 'inv-1' }),
    );
    getAccount.execute.mockResolvedValue(cardA);
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-1' });
    transactions.edit.mockResolvedValue({ id: TX_ID });

    await useCase.execute({ id: TX_ID, userId: USER_ID, amount: 70 });

    expect(cycle.resolveInvoiceForDate).toHaveBeenCalledWith({
      accountId: CARD_A,
      date: new Date('2026-07-15T12:00:00Z'),
      closeDay: 10,
      dueDay: 20,
    });
    expect(transactions.edit).toHaveBeenCalledWith({
      id: TX_ID,
      userId: USER_ID,
      amount: 70,
      newInvoiceId: 'inv-1',
    });
  });

  it('resolves new invoice on a different card when accountId changes', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    transactions.findById.mockResolvedValue(
      currentTx({ accountId: CARD_A, invoiceId: 'inv-a' }),
    );
    getAccount.execute.mockResolvedValue(cardB);
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-b' });
    transactions.edit.mockResolvedValue({ id: TX_ID });

    await useCase.execute({ id: TX_ID, userId: USER_ID, accountId: CARD_B });

    expect(getAccount.execute).toHaveBeenCalledWith({
      id: CARD_B,
      userId: USER_ID,
    });
    expect(cycle.resolveInvoiceForDate).toHaveBeenCalledWith({
      accountId: CARD_B,
      date: new Date('2026-07-15T12:00:00Z'),
      closeDay: 5,
      dueDay: 15,
    });
    expect(transactions.edit).toHaveBeenCalledWith({
      id: TX_ID,
      userId: USER_ID,
      accountId: CARD_B,
      newInvoiceId: 'inv-b',
    });
  });

  it('passes newInvoiceId=null when moving from card to debit account', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    transactions.findById.mockResolvedValue(
      currentTx({ accountId: CARD_A, invoiceId: 'inv-a' }),
    );
    getAccount.execute.mockResolvedValue(debit);
    transactions.edit.mockResolvedValue({ id: TX_ID });

    await useCase.execute({ id: TX_ID, userId: USER_ID, accountId: DEBIT_ID });

    expect(cycle.resolveInvoiceForDate).not.toHaveBeenCalled();
    expect(transactions.edit).toHaveBeenCalledWith({
      id: TX_ID,
      userId: USER_ID,
      accountId: DEBIT_ID,
      newInvoiceId: null,
    });
  });

  it('throws TransactionNotFoundError when the transaction does not exist', async () => {
    const { useCase, transactions } = buildUseCase();
    transactions.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: TX_ID, userId: USER_ID, amount: 10 }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('throws AccountNotFoundError when the new account cannot be found', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    transactions.findById.mockResolvedValue(currentTx());
    getAccount.execute.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: TX_ID, userId: USER_ID, accountId: 'ghost' }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
