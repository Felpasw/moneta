import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { TransactionNotFoundError } from '~/finance/transactions/domain/errors/transaction-not-found.error';
import { EditTransactionTool } from '~/agent/tools/transactions/edit-transaction.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const TRANSACTION_ID = 'a4b1c1e0-0000-4000-8000-000000000003';

const buildTool = () => {
  const editTransaction = { execute: jest.fn() };
  const tool = new EditTransactionTool(editTransaction as never);
  return { tool, editTransaction };
};

describe('EditTransactionTool', () => {
  it('edits the transaction and returns the updated record', async () => {
    const { tool, editTransaction } = buildTool();
    const updated = { id: TRANSACTION_ID, amount: 55 };
    editTransaction.execute.mockResolvedValue(updated);

    const result = await tool.execute({ id: TRANSACTION_ID, amount: 55 }, CTX);

    expect(result).toEqual({ ok: true, data: updated });
    expect(editTransaction.execute).toHaveBeenCalledWith({
      id: TRANSACTION_ID,
      userId: 'user-1',
      amount: 55,
    });
  });

  it('returns ok:false when the transaction is not found', async () => {
    const { tool, editTransaction } = buildTool();
    editTransaction.execute.mockRejectedValue(
      new TransactionNotFoundError(TRANSACTION_ID),
    );

    const result = await tool.execute({ id: TRANSACTION_ID, amount: 10 }, CTX);

    expect(result.ok).toBe(false);
  });

  it('returns ok:false when moving to an unowned account', async () => {
    const { tool, editTransaction } = buildTool();
    editTransaction.execute.mockRejectedValue(
      new AccountNotFoundError('foreign'),
    );

    const result = await tool.execute(
      {
        id: TRANSACTION_ID,
        accountId: '00000000-0000-4000-8000-000000000099',
      },
      CTX,
    );

    expect(result.ok).toBe(false);
  });
});
