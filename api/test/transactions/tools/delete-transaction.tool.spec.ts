import { TransactionNotFoundError } from '~/transactions/domain/errors/transaction-not-found.error';
import { DeleteTransactionTool } from '~/transactions/tools/delete-transaction.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const TRANSACTION_ID = 'a4b1c1e0-0000-4000-8000-000000000003';

const buildTool = () => {
  const deleteTransaction = { execute: jest.fn() };
  const tool = new DeleteTransactionTool(deleteTransaction as never);
  return { tool, deleteTransaction };
};

describe('DeleteTransactionTool', () => {
  it('deletes the transaction and confirms with ok:true', async () => {
    const { tool, deleteTransaction } = buildTool();
    deleteTransaction.execute.mockResolvedValue(undefined);

    const result = await tool.execute({ id: TRANSACTION_ID }, CTX);

    expect(result).toEqual({
      ok: true,
      data: { id: TRANSACTION_ID, deleted: true },
    });
    expect(deleteTransaction.execute).toHaveBeenCalledWith({
      id: TRANSACTION_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:false when the transaction is not found', async () => {
    const { tool, deleteTransaction } = buildTool();
    deleteTransaction.execute.mockRejectedValue(
      new TransactionNotFoundError(TRANSACTION_ID),
    );

    const result = await tool.execute({ id: TRANSACTION_ID }, CTX);

    expect(result.ok).toBe(false);
  });
});
