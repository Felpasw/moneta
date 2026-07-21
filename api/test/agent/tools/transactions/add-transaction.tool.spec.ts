import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { AddTransactionTool } from '~/agent/tools/transactions/add-transaction.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const OCCURRED_AT = '2026-07-15T12:00:00.000Z';

const buildTool = () => {
  const addTransaction = { execute: jest.fn() };
  const tool = new AddTransactionTool(addTransaction as never);
  return { tool, addTransaction };
};

describe('AddTransactionTool', () => {
  it('creates a transaction and returns it', async () => {
    const { tool, addTransaction } = buildTool();
    const created = {
      id: 't-1',
      userId: 'user-1',
      accountId: ACCOUNT_ID,
      type: TransactionType.Expense,
      amount: 42.5,
    };
    addTransaction.execute.mockResolvedValue(created);

    const result = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        type: 'expense',
        amount: 42.5,
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: created });
    expect(addTransaction.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: ACCOUNT_ID,
      type: TransactionType.Expense,
      amount: 42.5,
      occurredAt: new Date(OCCURRED_AT),
    });
  });

  it('returns ok:false when the account is not owned', async () => {
    const { tool, addTransaction } = buildTool();
    addTransaction.execute.mockRejectedValue(
      new AccountNotFoundError(ACCOUNT_ID),
    );

    const result = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        type: 'expense',
        amount: 10,
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(result.ok).toBe(false);
  });

  it('returns ok:false when input fails validation (negative amount)', async () => {
    const { tool, addTransaction } = buildTool();

    const result = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        type: 'expense',
        amount: -1,
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(addTransaction.execute).not.toHaveBeenCalled();
  });
});
