import { SetAccountBalancesUseCase } from '~/finance/accounts/application/use-cases/set-account-balances.use-case';

const account = (id: string, balance: number) => ({
  id,
  userId: 'user-1',
  bankId: `bank-${id}`,
  nickname: 'x',
  balance,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
});

const buildUseCase = (): {
  useCase: SetAccountBalancesUseCase;
  accounts: { setBalance: jest.Mock };
} => {
  const accounts = { setBalance: jest.fn() };
  const useCase = new SetAccountBalancesUseCase(accounts as never);
  return { useCase, accounts };
};

describe('SetAccountBalancesUseCase', () => {
  it('atualiza saldo de cada conta e retorna updated preservando ordem', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.setBalance
      .mockResolvedValueOnce(account('acc-1', 5000))
      .mockResolvedValueOnce(account('acc-2', 500))
      .mockResolvedValueOnce(account('acc-3', 20000));

    const result = await useCase.execute({
      userId: 'user-1',
      balances: [
        { accountId: 'acc-1', balance: 5000 },
        { accountId: 'acc-2', balance: 500 },
        { accountId: 'acc-3', balance: 20000 },
      ],
    });

    expect(result.notFound).toEqual([]);
    expect(result.updated).toEqual([
      { accountId: 'acc-1', balance: 5000 },
      { accountId: 'acc-2', balance: 500 },
      { accountId: 'acc-3', balance: 20000 },
    ]);
    expect(accounts.setBalance).toHaveBeenNthCalledWith(
      1,
      'acc-1',
      'user-1',
      5000,
    );
  });

  it('coloca em notFound os accountIds que setBalance devolveu null (não são do user)', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.setBalance
      .mockResolvedValueOnce(account('acc-1', 100))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(account('acc-3', 300));

    const result = await useCase.execute({
      userId: 'user-1',
      balances: [
        { accountId: 'acc-1', balance: 100 },
        { accountId: 'acc-fantasma', balance: 200 },
        { accountId: 'acc-3', balance: 300 },
      ],
    });

    expect(result.updated.map((u) => u.accountId)).toEqual(['acc-1', 'acc-3']);
    expect(result.notFound).toEqual(['acc-fantasma']);
  });

  it('retorna updated vazio + notFound cheio quando nenhum accountId é do user', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.setBalance.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-1',
      balances: [
        { accountId: 'acc-a', balance: 10 },
        { accountId: 'acc-b', balance: 20 },
      ],
    });

    expect(result.updated).toEqual([]);
    expect(result.notFound).toEqual(['acc-a', 'acc-b']);
  });
});
