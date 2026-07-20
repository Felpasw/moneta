import { GetAccountByIdUseCase } from '~/finance/accounts/application/use-cases/get-account-by-id.use-case';

const buildUseCase = () => {
  const accounts = { findById: jest.fn() };
  const useCase = new GetAccountByIdUseCase(accounts as never);
  return { useCase, accounts };
};

const ACCOUNT_ID = 'acc-1';
const USER_ID = 'user-1';

describe('GetAccountByIdUseCase', () => {
  it('returns the account when it belongs to the user', async () => {
    const { useCase, accounts } = buildUseCase();
    const account = {
      id: ACCOUNT_ID,
      userId: USER_ID,
      bankId: 'b-1',
      nickname: 'Nubank',
      balance: 100,
      creditLimit: 5000,
      overdraftLimit: null,
      closeDay: 10,
      dueDay: 20,
    };
    accounts.findById.mockResolvedValue(account);

    const result = await useCase.execute({ id: ACCOUNT_ID, userId: USER_ID });

    expect(result).toBe(account);
    expect(accounts.findById).toHaveBeenCalledWith(ACCOUNT_ID, USER_ID);
  });

  it('returns null when no account matches (id or ownership)', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.findById.mockResolvedValue(null);

    const result = await useCase.execute({ id: 'ghost', userId: USER_ID });

    expect(result).toBeNull();
  });
});
