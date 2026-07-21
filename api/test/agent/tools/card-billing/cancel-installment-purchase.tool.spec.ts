import { InstallmentGroupNotFoundError } from '~/finance/card-billing/installments/domain/errors/installment-group-not-found.error';
import { CancelInstallmentPurchaseTool } from '~/agent/tools/card-billing/cancel-installment-purchase.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const GROUP_ID = 'a4b1c1e0-0000-4000-8000-000000000001';

const buildTool = () => {
  const useCase = { execute: jest.fn() };
  const tool = new CancelInstallmentPurchaseTool(useCase as never);
  return { tool, useCase };
};

describe('CancelInstallmentPurchaseTool', () => {
  it('cancels the group and returns the summary as ok:true', async () => {
    const { tool, useCase } = buildTool();
    const summary = {
      deletedCount: 12,
      affectedInvoiceIds: ['inv-a', 'inv-b'],
      refundedAmount: 4800,
    };
    useCase.execute.mockResolvedValue(summary);

    const res = await tool.execute({ groupId: GROUP_ID }, CTX);

    expect(res).toEqual({ ok: true, data: summary });
    expect(useCase.execute).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:false when the group is not found or not owned', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockRejectedValue(
      new InstallmentGroupNotFoundError(GROUP_ID),
    );

    const res = await tool.execute({ groupId: GROUP_ID }, CTX);

    expect(res.ok).toBe(false);
  });

  it('returns ok:false on invalid input (non-uuid groupId)', async () => {
    const { tool, useCase } = buildTool();

    const res = await tool.execute({ groupId: 'not-a-uuid' }, CTX);

    expect(res.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });
});
