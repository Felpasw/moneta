import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { CreditCardCycleService } from '~/finance/card-billing/domain/services/credit-card-cycle.service';

const ACCOUNT_ID = 'acc-1';

const buildService = () => {
  const invoices = {
    create: jest.fn(),
    findOpenForAccount: jest.fn(),
    findByAccountAndCycle: jest.fn(),
  };
  const service = new CreditCardCycleService(invoices);
  return { service, invoices };
};

const invoiceFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-1',
  accountId: ACCOUNT_ID,
  status: InvoiceStatus.Open,
  cycleStart: new Date(Date.UTC(2026, 6, 11)),
  cycleEnd: new Date(Date.UTC(2026, 7, 10)),
  dueDate: new Date(Date.UTC(2026, 7, 20)),
  totalAmount: 0,
  closedAt: null,
  paidAt: null,
  paidViaTransferId: null,
  ...overrides,
});

describe('CreditCardCycleService.resolveInvoiceForDate', () => {
  it('returns the existing invoice when one already exists for the computed cycle', async () => {
    const { service, invoices } = buildService();
    const existing = invoiceFixture();
    invoices.findByAccountAndCycle.mockResolvedValue(existing);

    const result = await service.resolveInvoiceForDate({
      accountId: ACCOUNT_ID,
      date: new Date(Date.UTC(2026, 6, 25)),
      closeDay: 10,
      dueDay: 20,
    });

    expect(result).toBe(existing);
    expect(invoices.findByAccountAndCycle).toHaveBeenCalledWith(
      ACCOUNT_ID,
      new Date(Date.UTC(2026, 6, 11)),
    );
    expect(invoices.create).not.toHaveBeenCalled();
  });

  it('creates a new invoice with the computed boundaries when none exists', async () => {
    const { service, invoices } = buildService();
    invoices.findByAccountAndCycle.mockResolvedValue(null);
    const created = invoiceFixture();
    invoices.create.mockResolvedValue(created);

    const result = await service.resolveInvoiceForDate({
      accountId: ACCOUNT_ID,
      date: new Date(Date.UTC(2026, 6, 25)),
      closeDay: 10,
      dueDay: 20,
    });

    expect(result).toBe(created);
    expect(invoices.create).toHaveBeenCalledWith({
      accountId: ACCOUNT_ID,
      cycleStart: new Date(Date.UTC(2026, 6, 11)),
      cycleEnd: new Date(Date.UTC(2026, 7, 10)),
      dueDate: new Date(Date.UTC(2026, 7, 20)),
    });
  });

  it('respects the closeDay fallback when the month is short (Feb + closeDay=31)', async () => {
    const { service, invoices } = buildService();
    invoices.findByAccountAndCycle.mockResolvedValue(null);
    invoices.create.mockResolvedValue(invoiceFixture());

    await service.resolveInvoiceForDate({
      accountId: ACCOUNT_ID,
      date: new Date(Date.UTC(2026, 1, 15)),
      closeDay: 31,
      dueDay: 10,
    });

    // closeDay=31 in Feb → Feb 28 (fallback). Previous close was Jan 31 (Jan has 31).
    // So cycleStart = Feb 1, cycleEnd = Feb 28, dueDate = Mar 10 (dueDay<closeDay → next month)
    expect(invoices.create).toHaveBeenCalledWith({
      accountId: ACCOUNT_ID,
      cycleStart: new Date(Date.UTC(2026, 1, 1)),
      cycleEnd: new Date(Date.UTC(2026, 1, 28)),
      dueDate: new Date(Date.UTC(2026, 2, 10)),
    });
  });
});
