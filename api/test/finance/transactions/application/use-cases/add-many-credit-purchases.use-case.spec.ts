import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { AddManyCreditPurchasesUseCase } from '~/finance/transactions/application/use-cases/add-many-credit-purchases.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { InvalidCreditPurchaseError } from '~/finance/transactions/domain/errors/invalid-credit-purchase.error';

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
  ...cardAccount,
  id: DEBIT_ID,
  creditLimit: null,
  closeDay: null,
  dueDay: null,
};

const buildUseCase = () => {
  const transactions = { addMany: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const cycle = { resolveInvoiceForDate: jest.fn() };
  const useCase = new AddManyCreditPurchasesUseCase(
    transactions as never,
    getAccount as never,
    cycle as never,
  );
  return { useCase, transactions, getAccount, cycle };
};

describe('AddManyCreditPurchasesUseCase', () => {
  it('resolves invoices per item and forwards enriched batch with type=expense + invoiceId', async () => {
    const { useCase, transactions, getAccount, cycle } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    cycle.resolveInvoiceForDate
      .mockResolvedValueOnce({ id: 'inv-1' })
      .mockResolvedValueOnce({ id: 'inv-2' });
    transactions.addMany.mockResolvedValue([{ id: 't-1' }, { id: 't-2' }]);

    await useCase.execute([
      {
        userId: USER_ID,
        accountId: CARD_ID,
        amount: 50,
        occurredAt: OCCURRED,
      },
      {
        userId: USER_ID,
        accountId: CARD_ID,
        amount: 80,
        occurredAt: new Date('2026-08-15T12:00:00Z'),
      },
    ]);

    expect(transactions.addMany).toHaveBeenCalledWith([
      expect.objectContaining({
        type: TransactionType.Expense,
        amount: 50,
        invoiceId: 'inv-1',
      }),
      expect.objectContaining({
        type: TransactionType.Expense,
        amount: 80,
        invoiceId: 'inv-2',
      }),
    ]);
    expect(getAccount.execute).toHaveBeenCalledTimes(1);
  });

  it('throws InvalidCreditPurchaseError if any item points to an account without credit card', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(debitAccount);

    await expect(
      useCase.execute([
        {
          userId: USER_ID,
          accountId: DEBIT_ID,
          amount: 10,
          occurredAt: OCCURRED,
        },
      ]),
    ).rejects.toBeInstanceOf(InvalidCreditPurchaseError);
    expect(transactions.addMany).not.toHaveBeenCalled();
  });

  it('throws AccountNotFoundError when an account does not exist', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(null);

    await expect(
      useCase.execute([
        {
          userId: USER_ID,
          accountId: 'ghost',
          amount: 10,
          occurredAt: OCCURRED,
        },
      ]),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
    expect(transactions.addMany).not.toHaveBeenCalled();
  });
});
