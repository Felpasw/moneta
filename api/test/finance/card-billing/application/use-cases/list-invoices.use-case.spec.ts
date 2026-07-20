import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { ListInvoicesUseCase } from '~/finance/card-billing/application/use-cases/list-invoices.use-case';
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
  const invoices = { listByAccount: jest.fn() };
  const getAccount = { execute: jest.fn() };
  const useCase = new ListInvoicesUseCase(
    invoices as never,
    getAccount as never,
  );
  return { useCase, invoices, getAccount };
};

describe('ListInvoicesUseCase', () => {
  it('lists invoices for the card account (optionally filtered by status)', async () => {
    const { useCase, invoices, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    const rows = [{ id: 'inv-1' }, { id: 'inv-2' }];
    invoices.listByAccount.mockResolvedValue(rows);

    const result = await useCase.execute({
      accountId: ACCOUNT_ID,
      userId: USER_ID,
      status: InvoiceStatus.Closed,
    });

    expect(invoices.listByAccount).toHaveBeenCalledWith(
      ACCOUNT_ID,
      InvoiceStatus.Closed,
    );
    expect(result).toBe(rows);
  });

  it('omits the status filter when not provided', async () => {
    const { useCase, invoices, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(cardAccount);
    invoices.listByAccount.mockResolvedValue([]);

    await useCase.execute({ accountId: ACCOUNT_ID, userId: USER_ID });

    expect(invoices.listByAccount).toHaveBeenCalledWith(ACCOUNT_ID, undefined);
  });

  it('throws AccountNotFoundError when the account is missing or unowned', async () => {
    const { useCase, invoices, getAccount } = buildUseCase();
    getAccount.execute.mockResolvedValue(null);

    await expect(
      useCase.execute({ accountId: 'ghost', userId: USER_ID }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
    expect(invoices.listByAccount).not.toHaveBeenCalled();
  });
});
