import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { GetCurrentInvoiceUseCase } from '~/finance/card-billing/application/use-cases/get-current-invoice.use-case';
import { InvoiceStatus } from '~/finance/card-billing/domain/constants/invoice-status';

const ACCOUNT_ID = 'acc-1';
const USER_ID = 'user-1';

const cardAccount = {
  id: ACCOUNT_ID,
  userId: USER_ID,
  bankId: 'b-1',
  nickname: 'Nubank',
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 10,
  dueDay: 20,
};

const buildUseCase = () => {
  const invoices = { findOpenForAccount: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const useCase = new GetCurrentInvoiceUseCase(
    invoices as never,
    getAccount as never,
  );
  return { useCase, invoices, getAccount };
};

describe('GetCurrentInvoiceUseCase', () => {
  it('returns the open invoice for the given card account', async () => {
    const { useCase, invoices, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    const invoice = {
      id: 'inv-1',
      accountId: ACCOUNT_ID,
      status: InvoiceStatus.Open,
      cycleStart: new Date('2026-07-11T00:00:00Z'),
      cycleEnd: new Date('2026-08-10T00:00:00Z'),
      dueDate: new Date('2026-08-20T00:00:00Z'),
      totalAmount: 420,
      closedAt: null,
      paidAt: null,
      paidViaTransferId: null,
    };
    invoices.findOpenForAccount.mockResolvedValue(invoice);

    const result = await useCase.execute({
      accountId: ACCOUNT_ID,
      userId: USER_ID,
    });

    expect(getAccount.execute).toHaveBeenCalledWith({
      id: ACCOUNT_ID,
      userId: USER_ID,
    });
    expect(invoices.findOpenForAccount).toHaveBeenCalledWith(ACCOUNT_ID);
    expect(result).toBe(invoice);
  });

  it('returns null when the account has no open invoice yet', async () => {
    const { useCase, invoices, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    invoices.findOpenForAccount.mockResolvedValue(null);

    const result = await useCase.execute({
      accountId: ACCOUNT_ID,
      userId: USER_ID,
    });

    expect(result).toBeNull();
  });

  it('throws AccountNotFoundError when the account is missing or unowned', async () => {
    const { useCase, invoices, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(null);

    await expect(
      useCase.execute({ accountId: 'ghost', userId: USER_ID }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
    expect(invoices.findOpenForAccount).not.toHaveBeenCalled();
  });
});
