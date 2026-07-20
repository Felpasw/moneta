import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';
import { TransactionType } from '~/transactions/domain/constants/transaction-type';
import { AddTransactionsTool } from '~/transactions/tools/add-transactions.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const OCCURRED_AT = '2026-07-15T12:00:00.000Z';

const buildTool = () => {
  const addMany = { execute: jest.fn() };
  const tool = new AddTransactionsTool(addMany as never);
  return { tool, addMany };
};

describe('AddTransactionsTool', () => {
  it('creates a batch of transactions and returns them in order', async () => {
    const { tool, addMany } = buildTool();
    const created = [
      { id: 't-1', amount: 10 },
      { id: 't-2', amount: 25 },
    ];
    addMany.execute.mockResolvedValue(created);

    const result = await tool.execute(
      {
        transactions: [
          {
            accountId: ACCOUNT_ID,
            type: 'expense',
            amount: 10,
            occurredAt: OCCURRED_AT,
          },
          {
            accountId: ACCOUNT_ID,
            type: 'expense',
            amount: 25,
            occurredAt: OCCURRED_AT,
          },
        ],
      },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: created });
    expect(addMany.execute).toHaveBeenCalledWith([
      {
        userId: 'user-1',
        accountId: ACCOUNT_ID,
        type: TransactionType.Expense,
        amount: 10,
        occurredAt: new Date(OCCURRED_AT),
      },
      {
        userId: 'user-1',
        accountId: ACCOUNT_ID,
        type: TransactionType.Expense,
        amount: 25,
        occurredAt: new Date(OCCURRED_AT),
      },
    ]);
  });

  it('returns ok:false when any item fails ownership (batch rejected atomically)', async () => {
    const { tool, addMany } = buildTool();
    addMany.execute.mockRejectedValue(new AccountNotFoundError('foreign'));

    const result = await tool.execute(
      {
        transactions: [
          {
            accountId: ACCOUNT_ID,
            type: 'expense',
            amount: 10,
            occurredAt: OCCURRED_AT,
          },
        ],
      },
      CTX,
    );

    expect(result.ok).toBe(false);
  });

  it('rejects empty transactions array', async () => {
    const { tool, addMany } = buildTool();

    const result = await tool.execute({ transactions: [] }, CTX);

    expect(result.ok).toBe(false);
    expect(addMany.execute).not.toHaveBeenCalled();
  });
});
