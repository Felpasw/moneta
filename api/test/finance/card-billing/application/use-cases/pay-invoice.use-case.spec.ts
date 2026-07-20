import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';
import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { PayInvoiceUseCase } from '~/finance/card-billing/application/use-cases/pay-invoice.use-case';
import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';
import { InvoiceAlreadyPaidError } from '~/finance/card-billing/domain/errors/invoice-already-paid.error';
import { InvoiceNotFoundError } from '~/finance/card-billing/domain/errors/invoice-not-found.error';

const USER_ID = 'user-1';
const INVOICE_ID = 'inv-1';
const CARD_ACCOUNT_ID = 'card-1';
const FROM_ACCOUNT_ID = 'checking-1';
const NOW = new Date('2026-07-20T18:00:00Z');

const closedInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: INVOICE_ID,
  accountId: CARD_ACCOUNT_ID,
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
  const createTransfer = { execute: jest.fn() };
  const clock = new FixedClock(NOW);
  const useCase = new PayInvoiceUseCase(
    invoices as never,
    createTransfer as never,
    clock,
  );
  return { useCase, invoices, createTransfer };
};

describe('PayInvoiceUseCase', () => {
  it('creates a transfer for the invoice total_amount and marks the invoice paid', async () => {
    const { useCase, invoices, createTransfer } = buildUseCase();
    invoices.findByIdForUser.mockResolvedValue(closedInvoice());
    createTransfer.execute.mockResolvedValue({
      id: 'tr-1',
      fromAccountId: FROM_ACCOUNT_ID,
      toAccountId: CARD_ACCOUNT_ID,
      amount: 850,
    });

    const result = await useCase.execute({
      invoiceId: INVOICE_ID,
      fromAccountId: FROM_ACCOUNT_ID,
      userId: USER_ID,
    });

    expect(createTransfer.execute).toHaveBeenCalledWith({
      userId: USER_ID,
      fromAccountId: FROM_ACCOUNT_ID,
      toAccountId: CARD_ACCOUNT_ID,
      amount: 850,
      description: `Payment of invoice ${INVOICE_ID}`,
      occurredAt: NOW,
    });
    expect(invoices.markPaid).toHaveBeenCalledWith(INVOICE_ID, NOW, 'tr-1');
    expect(result.invoice.id).toBe(INVOICE_ID);
    expect(result.transfer.id).toBe('tr-1');
  });

  it('throws InvoiceNotFoundError when the invoice is missing or unowned', async () => {
    const { useCase, invoices, createTransfer } = buildUseCase();
    invoices.findByIdForUser.mockResolvedValue(null);

    await expect(
      useCase.execute({
        invoiceId: 'ghost',
        fromAccountId: FROM_ACCOUNT_ID,
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(InvoiceNotFoundError);
    expect(createTransfer.execute).not.toHaveBeenCalled();
    expect(invoices.markPaid).not.toHaveBeenCalled();
  });

  it('throws InvoiceAlreadyPaidError when the invoice is already paid', async () => {
    const { useCase, invoices, createTransfer } = buildUseCase();
    invoices.findByIdForUser.mockResolvedValue(
      closedInvoice({
        status: InvoiceStatus.Paid,
        paidAt: new Date('2026-07-15T10:00:00Z'),
      }),
    );

    await expect(
      useCase.execute({
        invoiceId: INVOICE_ID,
        fromAccountId: FROM_ACCOUNT_ID,
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(InvoiceAlreadyPaidError);
    expect(createTransfer.execute).not.toHaveBeenCalled();
  });

  it('propagates AccountNotFoundError from CreateTransferUseCase when source is unowned', async () => {
    const { useCase, invoices, createTransfer } = buildUseCase();
    invoices.findByIdForUser.mockResolvedValue(closedInvoice());
    createTransfer.execute.mockRejectedValue(
      new AccountNotFoundError(FROM_ACCOUNT_ID),
    );

    await expect(
      useCase.execute({
        invoiceId: INVOICE_ID,
        fromAccountId: FROM_ACCOUNT_ID,
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
    expect(invoices.markPaid).not.toHaveBeenCalled();
  });
});
