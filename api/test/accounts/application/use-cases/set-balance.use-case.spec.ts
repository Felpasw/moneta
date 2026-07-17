import { SetBalanceUseCase } from '~/accounts/application/use-cases/set-balance.use-case';
import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';

const buildUseCase = () => {
  const accounts = { setBalance: jest.fn() };
  const useCase = new SetBalanceUseCase(accounts);
  return { useCase, accounts };
};

describe('SetBalanceUseCase', () => {
  it('overwrites the balance and returns the fresh snapshot', async () => {
    const { useCase, accounts } = buildUseCase();
    const updated = {
      id: 'acc-1',
      userId: 'user-1',
      bankId: 'bank-1',
      nickname: 'Nubank',
      balance: 250.75,
      creditLimit: null,
      overdraftLimit: null,
      closeDay: null,
      dueDay: null,
    };
    accounts.setBalance.mockResolvedValue(updated);

    const result = await useCase.execute({
      id: 'acc-1',
      userId: 'user-1',
      amount: 250.75,
    });

    expect(result).toEqual(updated);
    expect(accounts.setBalance).toHaveBeenCalledWith('acc-1', 'user-1', 250.75);
  });

  it('throws AccountNotFoundError when the repo reports null', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.setBalance.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'other-acc', userId: 'user-1', amount: 100 }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
