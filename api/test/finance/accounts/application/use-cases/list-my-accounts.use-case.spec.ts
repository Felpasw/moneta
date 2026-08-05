import { ListMyAccountsUseCase } from '~/finance/accounts/application/use-cases/list-my-accounts.use-case';
import type { UserBankAccountWithBank } from '~/finance/accounts/domain/ports/user-bank-accounts-repository';

const buildUseCase = () => {
  const accounts = { listByUserId: jest.fn() };
  const useCase = new ListMyAccountsUseCase(accounts);
  return { useCase, accounts };
};

describe('ListMyAccountsUseCase', () => {
  it('returns the accounts owned by the given user with the bank nested', async () => {
    const { useCase, accounts } = buildUseCase();
    const owned: UserBankAccountWithBank[] = [
      {
        id: 'a-1',
        userId: 'user-1',
        bankId: 'bank-1',
        nickname: 'Nubank',
        balance: 100.5,
        creditLimit: null,
        overdraftLimit: null,
        closeDay: null,
        dueDay: null,
        bank: {
          id: 'bank-1',
          name: 'Nubank',
          compeCode: '260',
          logoUrl: null,
        },
      },
    ];
    accounts.listByUserId.mockResolvedValue(owned);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual(owned);
    expect(accounts.listByUserId).toHaveBeenCalledWith('user-1');
  });
});
