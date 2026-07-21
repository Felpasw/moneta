import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { GetCurrentInvoiceTool } from '~/agent/tools/card-billing/get-current-invoice.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000001';

const buildTool = () => {
  const getCurrentInvoice = { execute: jest.fn() };
  const tool = new GetCurrentInvoiceTool(getCurrentInvoice as never);
  return { tool, getCurrentInvoice };
};

describe('GetCurrentInvoiceTool', () => {
  it('returns the open invoice as ok:true', async () => {
    const { tool, getCurrentInvoice } = buildTool();
    const invoice = {
      id: 'inv-1',
      accountId: ACCOUNT_ID,
      status: InvoiceStatus.Open,
      totalAmount: 420,
    };
    getCurrentInvoice.execute.mockResolvedValue(invoice);

    const result = await tool.execute({ accountId: ACCOUNT_ID }, CTX);

    expect(result).toEqual({ ok: true, data: invoice });
    expect(getCurrentInvoice.execute).toHaveBeenCalledWith({
      accountId: ACCOUNT_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:true with data=null when there is no open invoice', async () => {
    const { tool, getCurrentInvoice } = buildTool();
    getCurrentInvoice.execute.mockResolvedValue(null);

    const result = await tool.execute({ accountId: ACCOUNT_ID }, CTX);

    expect(result).toEqual({ ok: true, data: null });
  });

  it('returns ok:false when the account is not owned by the user', async () => {
    const { tool, getCurrentInvoice } = buildTool();
    getCurrentInvoice.execute.mockRejectedValue(
      new AccountNotFoundError(ACCOUNT_ID),
    );

    const result = await tool.execute({ accountId: ACCOUNT_ID }, CTX);

    expect(result.ok).toBe(false);
  });
});
