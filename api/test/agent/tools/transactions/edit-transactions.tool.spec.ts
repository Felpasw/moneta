import { TransactionNotFoundError } from '~/transactions/domain/errors/transaction-not-found.error';
import { EditTransactionsTool } from '~/agent/tools/transactions/edit-transactions.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const TRANSACTION_ID_A = 'a4b1c1e0-0000-4000-8000-000000000003';
const TRANSACTION_ID_B = 'a4b1c1e0-0000-4000-8000-000000000004';

const buildTool = () => {
  const editMany = { execute: jest.fn() };
  const tool = new EditTransactionsTool(editMany as never);
  return { tool, editMany };
};

describe('EditTransactionsTool', () => {
  it('applies a batch of edits atomically', async () => {
    const { tool, editMany } = buildTool();
    const updated = [{ id: TRANSACTION_ID_A }, { id: TRANSACTION_ID_B }];
    editMany.execute.mockResolvedValue(updated);

    const result = await tool.execute(
      {
        edits: [
          { id: TRANSACTION_ID_A, amount: 55 },
          {
            id: TRANSACTION_ID_B,
            categoryId: '00000000-0000-4000-8000-000000000099',
          },
        ],
      },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: updated });
    expect(editMany.execute).toHaveBeenCalledWith([
      { id: TRANSACTION_ID_A, amount: 55, userId: 'user-1' },
      {
        id: TRANSACTION_ID_B,
        categoryId: '00000000-0000-4000-8000-000000000099',
        userId: 'user-1',
      },
    ]);
  });

  it('returns ok:false when any item is missing (batch atomically rejected)', async () => {
    const { tool, editMany } = buildTool();
    editMany.execute.mockRejectedValue(
      new TransactionNotFoundError(TRANSACTION_ID_A),
    );

    const result = await tool.execute(
      { edits: [{ id: TRANSACTION_ID_A, amount: 55 }] },
      CTX,
    );

    expect(result.ok).toBe(false);
  });
});
