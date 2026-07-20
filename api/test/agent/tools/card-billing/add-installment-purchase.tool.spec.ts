import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { InstallmentPurchaseNotAllowedError } from '~/finance/card-billing/installments/domain/errors/installment-purchase-not-allowed.error';
import { AddInstallmentPurchaseTool } from '~/agent/tools/card-billing/add-installment-purchase.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const OCCURRED_AT = '2026-07-15T12:00:00.000Z';

const buildTool = () => {
  const useCase = { execute: jest.fn() };
  const tool = new AddInstallmentPurchaseTool(useCase as never);
  return { tool, useCase };
};

describe('AddInstallmentPurchaseTool', () => {
  it('creates the installment purchase and returns ok:true with the result', async () => {
    const { tool, useCase } = buildTool();
    const result = { group: { id: 'grp-1' }, transactionIds: ['t-1', 't-2'] };
    useCase.execute.mockResolvedValue(result);

    const res = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        totalAmount: 4800,
        installmentsCount: 12,
        description: 'PS5',
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(res).toEqual({ ok: true, data: result });
    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        accountId: ACCOUNT_ID,
        totalAmount: 4800,
        installmentsCount: 12,
        description: 'PS5',
      }),
    );
  });

  it('returns ok:false when neither totalAmount nor installmentAmount is provided', async () => {
    const { tool, useCase } = buildTool();

    const res = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        installmentsCount: 6,
        description: 'nada',
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(res.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('returns ok:false when installmentsCount is 1', async () => {
    const { tool, useCase } = buildTool();

    const res = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        totalAmount: 100,
        installmentsCount: 1,
        description: 'ilegal',
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(res.ok).toBe(false);
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('returns ok:false when target account is not a credit card', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockRejectedValue(
      new InstallmentPurchaseNotAllowedError(ACCOUNT_ID),
    );

    const res = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        totalAmount: 300,
        installmentsCount: 3,
        description: 'debito',
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(res.ok).toBe(false);
  });

  it('returns ok:false when the account is not owned by the user', async () => {
    const { tool, useCase } = buildTool();
    useCase.execute.mockRejectedValue(new AccountNotFoundError(ACCOUNT_ID));

    const res = await tool.execute(
      {
        accountId: ACCOUNT_ID,
        totalAmount: 300,
        installmentsCount: 3,
        description: 'foreign',
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(res.ok).toBe(false);
  });
});
