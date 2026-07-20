import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { AddTransactionUseCase } from '~/finance/transactions/application/use-cases/add-transaction.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

const ACCOUNT_ID = 'acc-1';
const USER_ID = 'user-1';
const OCCURRED_AT = new Date('2026-07-15T12:00:00Z');

const debitAccount = {
  id: ACCOUNT_ID,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Corrente',
  balance: 1000,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
};

const cardAccount = {
  id: ACCOUNT_ID,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Nubank',
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 10,
  dueDay: 20,
};

const buildUseCase = () => {
  const transactions = { add: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const cycle = { resolveInvoiceForDate: jest.fn() };
  const useCase = new AddTransactionUseCase(
    transactions as never,
    getAccount as never,
    cycle as never,
  );
  return { useCase, transactions, getAccount, cycle };
};

const BASE_INPUT = {
  userId: USER_ID,
  accountId: ACCOUNT_ID,
  type: TransactionType.Expense,
  amount: 42.5,
  occurredAt: OCCURRED_AT,
};

describe('AddTransactionUseCase', () => {
  it('creates a transaction on a debit account without touching invoices', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(debitAccount);
    const created = { id: 't-1', ...BASE_INPUT, invoiceId: null };
    transactions.add.mockResolvedValue(created);

    const result = await useCase.execute(BASE_INPUT);

    expect(result).toEqual(created);
    expect(cycle.resolveInvoiceForDate).not.toHaveBeenCalled();
    expect(transactions.add).toHaveBeenCalledWith(BASE_INPUT);
  });

  it('resolves the invoice and passes invoiceId when the account is a card', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-1' });
    const created = { id: 't-1', ...BASE_INPUT, invoiceId: 'inv-1' };
    transactions.add.mockResolvedValue(created);

    await useCase.execute(BASE_INPUT);

    expect(cycle.resolveInvoiceForDate).toHaveBeenCalledWith({
      accountId: ACCOUNT_ID,
      date: OCCURRED_AT,
      closeDay: 10,
      dueDay: 20,
    });
    expect(transactions.add).toHaveBeenCalledWith({
      ...BASE_INPUT,
      invoiceId: 'inv-1',
    });
  });

  it('throws AccountNotFoundError when the account is missing or not owned', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(null);

    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
    expect(transactions.add).not.toHaveBeenCalled();
  });
});
