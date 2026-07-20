import { InvoiceAlreadyPaidError } from '~/finance/card-billing/domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '~/finance/card-billing/domain/errors/invoice-not-found.error';
import { MarkInvoicePaidTool } from '~/agent/tools/card-billing/mark-invoice-paid.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const INVOICE_ID = 'a4b1c1e0-0000-4000-8000-000000000001';

const buildTool = () => {
  const markInvoicePaid = { execute: jest.fn() };
  const tool = new MarkInvoicePaidTool(markInvoicePaid as never);
  return { tool, markInvoicePaid };
};

describe('MarkInvoicePaidTool', () => {
  it('marks invoice paid and returns confirmation', async () => {
    const { tool, markInvoicePaid } = buildTool();
    markInvoicePaid.execute.mockResolvedValue(undefined);

    const result = await tool.execute({ invoiceId: INVOICE_ID }, CTX);

    expect(result).toEqual({
      ok: true,
      data: { id: INVOICE_ID, paid: true },
    });
    expect(markInvoicePaid.execute).toHaveBeenCalledWith({
      invoiceId: INVOICE_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:false when the invoice is not found', async () => {
    const { tool, markInvoicePaid } = buildTool();
    markInvoicePaid.execute.mockRejectedValue(
      new InvoiceNotFoundError(INVOICE_ID),
    );

    const result = await tool.execute({ invoiceId: INVOICE_ID }, CTX);

    expect(result.ok).toBe(false);
  });

  it('returns ok:false when the invoice is already paid', async () => {
    const { tool, markInvoicePaid } = buildTool();
    markInvoicePaid.execute.mockRejectedValue(
      new InvoiceAlreadyPaidError(INVOICE_ID),
    );

    const result = await tool.execute({ invoiceId: INVOICE_ID }, CTX);

    expect(result.ok).toBe(false);
  });
});
