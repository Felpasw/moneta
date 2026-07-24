import { ConfigureAccountDetailsUseCase } from '~/finance/accounts/application/use-cases/configure-account-details.use-case';

const account = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  userId: 'user-1',
  bankId: `bank-${id}`,
  nickname: 'x',
  balance: 0,
  creditLimit: null,
  overdraftLimit: null,
  closeDay: null,
  dueDay: null,
  ...overrides,
});

const buildUseCase = (): {
  useCase: ConfigureAccountDetailsUseCase;
  accounts: { update: jest.Mock };
} => {
  const accounts = { update: jest.fn() };
  const useCase = new ConfigureAccountDetailsUseCase(accounts as never);
  return { useCase, accounts };
};

describe('ConfigureAccountDetailsUseCase', () => {
  it('aplica os campos de crédito e overdraft em batch, preservando ordem', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.update
      .mockResolvedValueOnce(
        account('acc-1', {
          creditLimit: 7000,
          closeDay: 15,
          dueDay: 22,
        }),
      )
      .mockResolvedValueOnce(account('acc-2', { overdraftLimit: 500 }))
      .mockResolvedValueOnce(
        account('acc-3', {
          creditLimit: 3000,
          closeDay: 5,
          dueDay: 12,
          overdraftLimit: 200,
        }),
      );

    const result = await useCase.execute({
      userId: 'user-1',
      accounts: [
        {
          accountId: 'acc-1',
          creditLimit: 7000,
          closeDay: 15,
          dueDay: 22,
        },
        { accountId: 'acc-2', overdraftLimit: 500 },
        {
          accountId: 'acc-3',
          creditLimit: 3000,
          closeDay: 5,
          dueDay: 12,
          overdraftLimit: 200,
        },
      ],
    });

    expect(result.notFound).toEqual([]);
    expect(result.updated).toEqual([
      { accountId: 'acc-1' },
      { accountId: 'acc-2' },
      { accountId: 'acc-3' },
    ]);
    expect(accounts.update).toHaveBeenNthCalledWith(1, {
      id: 'acc-1',
      userId: 'user-1',
      creditLimit: 7000,
      closeDay: 15,
      dueDay: 22,
    });
    expect(accounts.update).toHaveBeenNthCalledWith(2, {
      id: 'acc-2',
      userId: 'user-1',
      overdraftLimit: 500,
    });
  });

  it('coloca em notFound os accountIds que update devolveu null', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.update
      .mockResolvedValueOnce(account('acc-ok', { overdraftLimit: 100 }))
      .mockResolvedValueOnce(null);

    const result = await useCase.execute({
      userId: 'user-1',
      accounts: [
        { accountId: 'acc-ok', overdraftLimit: 100 },
        { accountId: 'acc-fantasma', overdraftLimit: 200 },
      ],
    });

    expect(result.updated).toEqual([{ accountId: 'acc-ok' }]);
    expect(result.notFound).toEqual(['acc-fantasma']);
  });

  it('devolve updated vazio + notFound cheio quando nenhum account é do user', async () => {
    const { useCase, accounts } = buildUseCase();
    accounts.update.mockResolvedValue(null);

    const result = await useCase.execute({
      userId: 'user-1',
      accounts: [
        { accountId: 'acc-a', creditLimit: 1000, closeDay: 10, dueDay: 20 },
      ],
    });

    expect(result.updated).toEqual([]);
    expect(result.notFound).toEqual(['acc-a']);
  });
});
