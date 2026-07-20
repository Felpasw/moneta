import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';
import { MarkInvoicePaidUseCase } from '~/finance/card-billing/application/use-cases/mark-invoice-paid.use-case';
import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { InvoiceAlreadyPaidError } from '~/finance/card-billing/domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '~/finance/card-billing/domain/errors/invoice-not-found.error';

const USER_ID = 'user-1';
const INVOICE_ID = 'inv-1';
const NOW = new Date('2026-07-20T18:00:00Z');

const closedInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: INVOICE_ID,
  accountId: 'card-1',
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

const buildUseCase = () => {
  const invoices = {
    findByIdForUser: jest.fn(),
    markPaid: jest.fn(),
  };
  const clock = new FixedClock(NOW);
  const useCase = new MarkInvoicePaidUseCase(invoices as never, clock);
  return { useCase, invoices };
};

describe('MarkInvoicePaidUseCase', () => {
  it('marks the invoice paid without a transfer id (manual fallback)', async () => {
    const { useCase, invoices } = buildUseCase();
    invoices.findByIdForUser.mockResolvedValue(closedInvoice());

    await useCase.execute({ invoiceId: INVOICE_ID, userId: USER_ID });

    expect(invoices.markPaid).toHaveBeenCalledWith(INVOICE_ID, NOW, undefined);
  });

  it('throws InvoiceNotFoundError when the invoice is missing or unowned', async () => {
    const { useCase, invoices } = buildUseCase();
    invoices.findByIdForUser.mockResolvedValue(null);

    await expect(
      useCase.execute({ invoiceId: 'ghost', userId: USER_ID }),
    ).rejects.toBeInstanceOf(InvoiceNotFoundError);
    expect(invoices.markPaid).not.toHaveBeenCalled();
  });

  it('throws InvoiceAlreadyPaidError when the invoice is already paid', async () => {
    const { useCase, invoices } = buildUseCase();
    invoices.findByIdForUser.mockResolvedValue(
      closedInvoice({
        status: InvoiceStatus.Paid,
        paidAt: new Date('2026-07-15T10:00:00Z'),
      }),
    );

    await expect(
      useCase.execute({ invoiceId: INVOICE_ID, userId: USER_ID }),
    ).rejects.toBeInstanceOf(InvoiceAlreadyPaidError);
    expect(invoices.markPaid).not.toHaveBeenCalled();
  });
});
