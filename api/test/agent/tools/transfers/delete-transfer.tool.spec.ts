import { TransferNotFoundError } from '~/finance/transfers/domain/errors/transfer-not-found.error';
import { DeleteTransferTool } from '~/agent/tools/transfers/delete-transfer.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const TRANSFER_ID = 'a4b1c1e0-0000-4000-8000-000000000003';

const buildTool = () => {
  const deleteTransfer = { execute: jest.fn() };
  const tool = new DeleteTransferTool(deleteTransfer as never);
  return { tool, deleteTransfer };
};

describe('DeleteTransferTool', () => {
  it('deletes the transfer and confirms with ok:true', async () => {
    const { tool, deleteTransfer } = buildTool();
    deleteTransfer.execute.mockResolvedValue(undefined);

    const result = await tool.execute({ id: TRANSFER_ID }, CTX);

    expect(result).toEqual({
      ok: true,
      data: { id: TRANSFER_ID, deleted: true },
    });
    expect(deleteTransfer.execute).toHaveBeenCalledWith({
      id: TRANSFER_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:false when the transfer is not found', async () => {
    const { tool, deleteTransfer } = buildTool();
    deleteTransfer.execute.mockRejectedValue(
      new TransferNotFoundError(TRANSFER_ID),
    );

    const result = await tool.execute({ id: TRANSFER_ID }, CTX);

    expect(result.ok).toBe(false);
  });
});
