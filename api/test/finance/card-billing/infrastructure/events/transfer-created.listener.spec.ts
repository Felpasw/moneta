import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { TransferCreatedListener } from '~/finance/card-billing/infrastructure/events/transfer-created.listener';
import type { TransferCreatedPayload } from '~/finance/transfers/domain/events/transfer-created.event';

const USER_ID = 'user-1';
const CARD_ID = 'card-1';
const DEBIT_ID = 'debit-1';
const TRANSFER_ID = 'tr-1';

const cardAccount = {
  id: CARD_ID,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Nubank',
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 10,
  dueDay: 20,
};

const debitAccount = {
  ...cardAccount,
  id: DEBIT_ID,
  creditLimit: null,
  closeDay: null,
  dueDay: null,
};

const closedInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-1',
  accountId: CARD_ID,
  status: InvoiceStatus.Closed,
  cycleStart: new Date('2026-06-11T00:00:00Z'),
  cycleEnd: new Date('2026-07-10T00:00:00Z'),
  dueDate: new Date('2026-07-20T00:00:00Z'),
  totalAmount: 850,
  closedAt: new Date('2026-07-11T03:00:00Z'),
  paidAt: null,
  paidViaTransferId: null,
  ...overrides,
});

const payload = (
  overrides: Partial<TransferCreatedPayload> = {},
): TransferCreatedPayload => ({
  transferId: TRANSFER_ID,
  userId: USER_ID,
  fromAccountId: DEBIT_ID,
  toAccountId: CARD_ID,
  amount: 850,
  occurredAt: new Date('2026-07-20T18:00:00Z'),
  ...overrides,
});

const buildListener = () => {
  const invoices = {
    listByAccount: jest.fn(),
    markPaid: jest.fn(),
  };
  const getAccount = { execute: jest.fn() };
  const listener = new TransferCreatedListener(
    invoices as never,
    getAccount as never,
  );
  return { listener, invoices, getAccount };
};

describe('TransferCreatedListener', () => {
  it('auto-marks invoice paid when target is a card and amount matches an unpaid closed invoice', async () => {
    const { listener, invoices, getAccount } = buildListener();
    getAccount.execute.mockResolvedValue(cardAccount);
    invoices.listByAccount.mockResolvedValue([
      closedInvoice({ totalAmount: 850 }),
    ]);

    await listener.handle(payload());

    expect(getAccount.execute).toHaveBeenCalledWith({
      id: CARD_ID,
      userId: USER_ID,
    });
    expect(invoices.listByAccount).toHaveBeenCalledWith(
      CARD_ID,
      InvoiceStatus.Closed,
    );
    expect(invoices.markPaid).toHaveBeenCalledWith(
      'inv-1',
      payload().occurredAt,
      TRANSFER_ID,
    );
  });

  it('does nothing when target is a debit account (creditLimit=null)', async () => {
    const { listener, invoices, getAccount } = buildListener();
    getAccount.execute.mockResolvedValue(debitAccount);

    await listener.handle(payload({ toAccountId: DEBIT_ID }));

    expect(invoices.listByAccount).not.toHaveBeenCalled();
    expect(invoices.markPaid).not.toHaveBeenCalled();
  });

  it('does nothing when no closed invoice matches the amount', async () => {
    const { listener, invoices, getAccount } = buildListener();
    getAccount.execute.mockResolvedValue(cardAccount);
    invoices.listByAccount.mockResolvedValue([
      closedInvoice({ totalAmount: 700 }),
      closedInvoice({ id: 'inv-2', totalAmount: 1200 }),
    ]);

    await listener.handle(payload({ amount: 999 }));

    expect(invoices.markPaid).not.toHaveBeenCalled();
  });

  it('does nothing when there are no closed invoices at all', async () => {
    const { listener, invoices, getAccount } = buildListener();
    getAccount.execute.mockResolvedValue(cardAccount);
    invoices.listByAccount.mockResolvedValue([]);

    await listener.handle(payload());

    expect(invoices.markPaid).not.toHaveBeenCalled();
  });

  it('does nothing when the target account cannot be resolved (edge case, should not happen)', async () => {
    const { listener, invoices, getAccount } = buildListener();
    getAccount.execute.mockResolvedValue(null);

    await listener.handle(payload());

    expect(invoices.listByAccount).not.toHaveBeenCalled();
    expect(invoices.markPaid).not.toHaveBeenCalled();
  });

  it('picks the first matching invoice when multiple closed invoices share the same total_amount (edge case)', async () => {
    const { listener, invoices, getAccount } = buildListener();
    getAccount.execute.mockResolvedValue(cardAccount);
    invoices.listByAccount.mockResolvedValue([
      closedInvoice({ id: 'inv-oldest', totalAmount: 850 }),
      closedInvoice({ id: 'inv-newer', totalAmount: 850 }),
    ]);

    await listener.handle(payload());

    // listener picks the first invoice in the list; repo already orders desc
    // by cycle_start, so the caller sees newest first — mock respects that shape
    expect(invoices.markPaid).toHaveBeenCalledWith(
      'inv-oldest',
      payload().occurredAt,
      TRANSFER_ID,
    );
    expect(invoices.markPaid).toHaveBeenCalledTimes(1);
  });
});
