import { ListMyAccountsUseCase } from '~/accounts/application/use-cases/list-my-accounts.use-case';
import type { UserBankAccount } from '~/accounts/domain/ports/user-bank-accounts-repository';

const buildUseCase = () => {
  const accounts = { listByUserId: jest.fn() };
  const useCase = new ListMyAccountsUseCase(accounts);
  return { useCase, accounts };
};

describe('ListMyAccountsUseCase', () => {
  it('returns the accounts owned by the given user', async () => {
    const { useCase, accounts } = buildUseCase();
    const owned: UserBankAccount[] = [
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
      },
    ];
    accounts.listByUserId.mockResolvedValue(owned);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual(owned);
    expect(accounts.listByUserId).toHaveBeenCalledWith('user-1');
  });
});
