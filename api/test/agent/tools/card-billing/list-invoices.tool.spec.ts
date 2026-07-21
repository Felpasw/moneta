import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { ListInvoicesTool } from '~/agent/tools/card-billing/list-invoices.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000001';

const buildTool = () => {
  const listInvoices = { execute: jest.fn() };
  const tool = new ListInvoicesTool(listInvoices as never);
  return { tool, listInvoices };
};

describe('ListInvoicesTool', () => {
  it('lists invoices with the optional status filter', async () => {
    const { tool, listInvoices } = buildTool();
    const rows = [{ id: 'inv-1' }];
    listInvoices.execute.mockResolvedValue(rows);

    const result = await tool.execute(
      { accountId: ACCOUNT_ID, status: 'closed' },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: rows });
    expect(listInvoices.execute).toHaveBeenCalledWith({
      accountId: ACCOUNT_ID,
      userId: 'user-1',
      status: InvoiceStatus.Closed,
    });
  });

  it('omits the status filter when not provided', async () => {
    const { tool, listInvoices } = buildTool();
    listInvoices.execute.mockResolvedValue([]);

    await tool.execute({ accountId: ACCOUNT_ID }, CTX);

    expect(listInvoices.execute).toHaveBeenCalledWith({
      accountId: ACCOUNT_ID,
      userId: 'user-1',
      status: undefined,
    });
  });

  it('returns ok:false when the account is not owned by the user', async () => {
    const { tool, listInvoices } = buildTool();
    listInvoices.execute.mockRejectedValue(
      new AccountNotFoundError(ACCOUNT_ID),
    );

    const result = await tool.execute({ accountId: ACCOUNT_ID }, CTX);

    expect(result.ok).toBe(false);
  });

  it('returns ok:false when input status is invalid', async () => {
    const { tool, listInvoices } = buildTool();

    const result = await tool.execute(
      { accountId: ACCOUNT_ID, status: 'garbage' },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(listInvoices.execute).not.toHaveBeenCalled();
  });
});
