import { UpdateBankAccountUseCase } from '~/accounts/application/use-cases/update-bank-account.use-case';
import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';

const buildUseCase = () => {
  const accounts = { update: jest.fn() };
  const useCase = new UpdateBankAccountUseCase(accounts);
  return { useCase, accounts };
};

describe('UpdateBankAccountUseCase', () => {
  it('updates the account owned by the user and returns the fresh snapshot', async () => {
    const { useCase, accounts } = buildUseCase();
    const updated = {
      id: 'acc-1',
      userId: 'user-1',
      bankId: 'bank-1',
      nickname: 'Novo Nome',
      balance: 100,
      creditLimit: null,
      overdraftLimit: null,
      closeDay: null,
      dueDay: null,
    };
    accounts.update.mockResolvedValue(updated);

    const result = await useCase.execute({
      id: 'acc-1',
      userId: 'user-1',
      nickname: 'Novo Nome',
    });

    expect(result).toEqual(updated);
    expect(accounts.update).toHaveBeenCalledWith({
      id: 'acc-1',
      userId: 'user-1',
      nickname: 'Novo Nome',
    });
  });

  it('throws AccountNotFoundError when the repo does not find the account for this user', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.update.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'other-acc', userId: 'user-1', nickname: 'x' }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
