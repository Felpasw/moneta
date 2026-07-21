import { CancelInstallmentPurchaseUseCase } from '~/finance/card-billing/installments/application/use-cases/cancel-installment-purchase.use-case';
import { InstallmentGroupNotFoundError } from '~/finance/card-billing/installments/domain/errors/installment-group-not-found.error';

const USER_ID = 'user-1';
const GROUP_ID = 'grp-1';

const buildUseCase = () => {
  const groups = { cancelGroup: jest.fn() };
  const useCase = new CancelInstallmentPurchaseUseCase(groups as never);
  return { useCase, groups };
};

describe('CancelInstallmentPurchaseUseCase', () => {
  it('delegates to the repo and returns the cancellation summary', async () => {
    const { useCase, groups } = buildUseCase();
    const summary = {
      deletedCount: 12,
      affectedInvoiceIds: ['inv-1', 'inv-2', 'inv-3'],
      refundedAmount: 4800,
    };
    groups.cancelGroup.mockResolvedValue(summary);

    const result = await useCase.execute({
      groupId: GROUP_ID,
      userId: USER_ID,
    });

    expect(result).toBe(summary);
    expect(groups.cancelGroup).toHaveBeenCalledWith(GROUP_ID, USER_ID);
  });

  it('propagates InstallmentGroupNotFoundError from the repo', async () => {
    const { useCase, groups } = buildUseCase();
    groups.cancelGroup.mockRejectedValue(
      new InstallmentGroupNotFoundError(GROUP_ID),
    );

    await expect(
      useCase.execute({ groupId: 'ghost', userId: USER_ID }),
    ).rejects.toBeInstanceOf(InstallmentGroupNotFoundError);
  });
});
