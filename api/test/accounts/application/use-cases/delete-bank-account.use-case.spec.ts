import { DeleteBankAccountUseCase } from '~/accounts/application/use-cases/delete-bank-account.use-case';
import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';

const buildUseCase = () => {
  const accounts = { delete: jest.fn() };
  const useCase = new DeleteBankAccountUseCase(accounts);
  return { useCase, accounts };
};

describe('DeleteBankAccountUseCase', () => {
  it('deletes the account when the repo confirms deletion', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.delete.mockResolvedValue(true);

    await useCase.execute({ id: 'acc-1', userId: 'user-1' });

    expect(accounts.delete).toHaveBeenCalledWith('acc-1', 'user-1');
  });

  it('throws AccountNotFoundError when the repo reports nothing deleted', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.delete.mockResolvedValue(false);

    await expect(
      useCase.execute({ id: 'other-acc', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
