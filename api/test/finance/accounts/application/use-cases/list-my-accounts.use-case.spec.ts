import { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import type {
  AccountsSummary,
  UserBankAccountWithBank,
} from '~/finance/accounts/domain/ports/user-bank-accounts-repository';

const buildUseCase = () => {
  const accounts = {
    listByUserId: jest.fn(),
    summarizeCheckings: jest.fn(),
  };
  const useCase = new ListMyAccountsUseCase(accounts);
  return { useCase, accounts };
};

const bank = {
  id: 'bank-1',
  name: 'Nubank',
  compeCode: '260',
  logoUrl: null,
};

const checking = (id: string): UserBankAccountWithBank => ({
  id,
  userId: 'user-1',
  bankId: 'bank-1',
  nickname: id,
  balance: 100,
  creditLimit: null,
  overdraftLimit: 500,
  closeDay: null,
  dueDay: null,
  bank,
  currentInvoice: null,
  usagePct: 0,
});

describe('ListMyAccountsUseCase', () => {
  it('returns items from listByUserId + summary from summarizeCheckings', async () => {
    const { useCase, accounts } = buildUseCase();
    const owned = [checking('chk-1'), checking('chk-2')];
    const summary: AccountsSummary = {
      totalBalance: 1250.55,
      checkingCount: 2,
      totalOverdraft: 500,
    };
    accounts.listByUserId.mockResolvedValue(owned);
    accounts.summarizeCheckings.mockResolvedValue(summary);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({ items: owned, summary });
    expect(accounts.listByUserId).toHaveBeenCalledWith('user-1');
    expect(accounts.summarizeCheckings).toHaveBeenCalledWith('user-1');
  });

  it('runs items and summary queries in parallel', async () => {
    const { useCase, accounts } = buildUseCase();
    const order: string[] = [];
    accounts.listByUserId.mockImplementation(async () => {
      order.push('items-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('items-end');
      return [];
    });
    accounts.summarizeCheckings.mockImplementation(async () => {
      order.push('summary-start');
      await new Promise((r) => setTimeout(r, 10));
      order.push('summary-end');
      return { totalBalance: 0, checkingCount: 0, totalOverdraft: 0 };
    });

    await useCase.execute({ userId: 'user-1' });

    expect(order.slice(0, 2).sort()).toEqual(['items-start', 'summary-start']);
  });
});
