import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { AddCreditPurchaseUseCase } from '~/finance/transactions/application/use-cases/add-credit-purchase.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { InvalidCreditPurchaseError } from '~/finance/transactions/domain/errors/invalid-credit-purchase.error';

const USER_ID = 'user-1';
const CARD_ID = 'card-1';
const OCCURRED_AT = new Date('2026-07-15T12:00:00Z');

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
  ...cardAccount,
  creditLimit: null,
  closeDay: null,
  dueDay: null,
};

const buildUseCase = () => {
  const transactions = { add: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const cycle = { resolveInvoiceForDate: jest.fn() };
  const useCase = new AddCreditPurchaseUseCase(
    transactions as never,
    getAccount as never,
    cycle as never,
  );
  return { useCase, transactions, getAccount, cycle };
};

const INPUT = {
  userId: USER_ID,
  accountId: CARD_ID,
  amount: 120.5,
  description: 'Mercado',
  occurredAt: OCCURRED_AT,
};

describe('AddCreditPurchaseUseCase', () => {
  it('resolves the invoice, forces type=expense, and forwards to the repo', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    cycle.resolveInvoiceForDate.mockResolvedValue({ id: 'inv-1' });
    transactions.add.mockResolvedValue({ id: 't-1' });

    await useCase.execute(INPUT);

    expect(cycle.resolveInvoiceForDate).toHaveBeenCalledWith({
      accountId: CARD_ID,
      date: OCCURRED_AT,
      closeDay: 10,
      dueDay: 20,
    });
    expect(transactions.add).toHaveBeenCalledWith({
      userId: USER_ID,
      accountId: CARD_ID,
      type: TransactionType.Expense,
      amount: 120.5,
      categoryId: undefined,
      description: 'Mercado',
      occurredAt: OCCURRED_AT,
      invoiceId: 'inv-1',
    });
  });

  it('throws AccountNotFoundError when the account is missing', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(null);

    await expect(useCase.execute(INPUT)).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
    expect(transactions.add).not.toHaveBeenCalled();
  });

  it('throws InvalidCreditPurchaseError when the account has no credit card configured', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(debitAccount);

    await expect(useCase.execute(INPUT)).rejects.toBeInstanceOf(
      InvalidCreditPurchaseError,
    );
    expect(cycle.resolveInvoiceForDate).not.toHaveBeenCalled();
    expect(transactions.add).not.toHaveBeenCalled();
  });
});
