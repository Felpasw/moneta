import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { InvoiceAlreadyPaidError } from '~/finance/card-billing/domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '~/finance/card-billing/domain/errors/invoice-not-found.error';
import { SameAccountTransferError } from '~/finance/transfers/domain/errors/same-account-transfer.error';
import { PayInvoiceTool } from '~/agent/tools/card-billing/pay-invoice.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const INVOICE_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const FROM_ID = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildTool = () => {
  const payInvoice = { execute: jest.fn() };
  const tool = new PayInvoiceTool(payInvoice as never);
  return { tool, payInvoice };
};

describe('PayInvoiceTool', () => {
  it('returns ok:true with { invoice, transfer } on success', async () => {
    const { tool, payInvoice } = buildTool();
    const output = {
      invoice: { id: INVOICE_ID, status: 'paid' },
      transfer: { id: 'tr-1' },
    };
    payInvoice.execute.mockResolvedValue(output);

    const result = await tool.execute(
      { invoiceId: INVOICE_ID, fromAccountId: FROM_ID },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: output });
    expect(payInvoice.execute).toHaveBeenCalledWith({
      invoiceId: INVOICE_ID,
      fromAccountId: FROM_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:false for InvoiceNotFoundError', async () => {
    const { tool, payInvoice } = buildTool();
    payInvoice.execute.mockRejectedValue(new InvoiceNotFoundError(INVOICE_ID));

    const result = await tool.execute(
      { invoiceId: INVOICE_ID, fromAccountId: FROM_ID },
      CTX,
    );

    expect(result.ok).toBe(false);
  });

  it('returns ok:false for InvoiceAlreadyPaidError', async () => {
    const { tool, payInvoice } = buildTool();
    payInvoice.execute.mockRejectedValue(
      new InvoiceAlreadyPaidError(INVOICE_ID),
    );

    const result = await tool.execute(
      { invoiceId: INVOICE_ID, fromAccountId: FROM_ID },
      CTX,
    );

    expect(result.ok).toBe(false);
  });

  it('returns ok:false for AccountNotFoundError (source not owned)', async () => {
    const { tool, payInvoice } = buildTool();
    payInvoice.execute.mockRejectedValue(new AccountNotFoundError(FROM_ID));

    const result = await tool.execute(
      { invoiceId: INVOICE_ID, fromAccountId: FROM_ID },
      CTX,
    );

    expect(result.ok).toBe(false);
  });

  it('returns ok:false for SameAccountTransferError (fromAccountId equals card)', async () => {
    const { tool, payInvoice } = buildTool();
    payInvoice.execute.mockRejectedValue(new SameAccountTransferError(FROM_ID));

    const result = await tool.execute(
      { invoiceId: INVOICE_ID, fromAccountId: FROM_ID },
      CTX,
    );

    expect(result.ok).toBe(false);
  });
});
