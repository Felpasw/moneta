import { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import type { UserBankAccountWithBank } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';

const buildUseCase = () => {
  const accounts = { listByUserId: jest.fn() };
  const useCase = new ListMyAccountsUseCase(accounts);
  return { useCase, accounts };
};

const bank = {
  id: 'bank-1',
  name: 'Nubank',
  compeCode: '260',
  logoUrl: null,
};

const checking = (
  id: string,
  balance: number,
  overdraftLimit: number | null,
): UserBankAccountWithBank => ({
  id,
  userId: 'user-1',
  bankId: 'bank-1',
  nickname: id,
  balance,
  creditLimit: null,
  overdraftLimit,
  closeDay: null,
  dueDay: null,
  bank,
  currentInvoice: null,
  usagePct: 0,
});

const credit = (id: string): UserBankAccountWithBank => ({
  id,
  userId: 'user-1',
  bankId: 'bank-2',
  nickname: id,
  balance: 0,
  creditLimit: 5000,
  overdraftLimit: null,
  closeDay: 5,
  dueDay: 12,
  bank: { ...bank, id: 'bank-2', name: 'Nubank Cartão' },
  currentInvoice: null,
  usagePct: 0,
});

describe('ListMyAccountsUseCase', () => {
  it('returns items + summary aggregated only across checking accounts', async () => {
    const { useCase, accounts } = buildUseCase();
    const owned: UserBankAccountWithBank[] = [
      checking('chk-1', 1000, 500),
      checking('chk-2', 250, null),
      credit('cr-1'),
    ];
    accounts.listByUserId.mockResolvedValue(owned);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.items).toEqual(owned);
    expect(result.summary).toEqual({
      totalBalance: 1250,
      checkingCount: 2,
      totalOverdraft: 500,
    });
    expect(accounts.listByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns a zero summary when there are no accounts', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.listByUserId.mockResolvedValue([]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({
      items: [],
      summary: { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 },
    });
  });

  it('excludes credit accounts entirely from the summary aggregation', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.listByUserId.mockResolvedValue([credit('cr-1'), credit('cr-2')]);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.summary).toEqual({
      totalBalance: 0,
      checkingCount: 0,
      totalOverdraft: 0,
    });
  });
});
