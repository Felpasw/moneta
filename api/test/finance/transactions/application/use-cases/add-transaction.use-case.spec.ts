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

const hybridAccount = {
  ...debitAccount,
  nickname: 'Nubank',
  creditLimit: 5000,
  closeDay: 10,
  dueDay: 20,
};

const buildUseCase = () => {
  const transactions = { add: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const useCase = new AddTransactionUseCase(
    transactions as never,
    getAccount as never,
  );
  return { useCase, transactions, getAccount };
};

const BASE_INPUT = {
  userId: USER_ID,
  accountId: ACCOUNT_ID,
  type: TransactionType.Expense,
  amount: 42.5,
  occurredAt: OCCURRED_AT,
};

describe('AddTransactionUseCase (debit-only)', () => {
  it('creates a transaction on a debit account and forwards it as-is (no invoiceId)', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(debitAccount);
    const created = { id: 't-1', ...BASE_INPUT, invoiceId: null };
    transactions.add.mockResolvedValue(created);

    const result = await useCase.execute(BASE_INPUT);

    expect(result).toEqual(created);
    expect(transactions.add).toHaveBeenCalledWith(BASE_INPUT);
  });

  it('creates a transaction on a hybrid account without touching any invoice (debit path)', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(hybridAccount);
    transactions.add.mockResolvedValue({ id: 't-2', ...BASE_INPUT });

    await useCase.execute(BASE_INPUT);

    expect(transactions.add).toHaveBeenCalledWith(BASE_INPUT);
    // MNT-230: this tool is always debit — no invoice resolution here.
    const [passed] = transactions.add.mock.calls[0] as unknown as [
      { invoiceId?: string },
    ];
    expect(passed.invoiceId).toBeUndefined();
  });

  it('accepts income on any account (no more MNT-227 block)', async () => {
    const { useCase, transactions, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(hybridAccount);
    transactions.add.mockResolvedValue({
      id: 't-3',
      ...BASE_INPUT,
      type: TransactionType.Income,
    });

    await useCase.execute({ ...BASE_INPUT, type: TransactionType.Income });

    expect(transactions.add).toHaveBeenCalled();
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
