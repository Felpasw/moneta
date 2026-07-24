import { AddUserBanksUseCase } from '~/finance/accounts/application/use-cases/add-user-banks.use-case';
import type { Bank } from '~/finance/banks/domain/ports/banks-repository';

const bank = (id: string, name: string): Bank => ({
  id,
  name,
  compeCode: '000',
  logoUrl: null,
});

const buildUseCase = (): {
  useCase: AddUserBanksUseCase;
  banks: { findManyByIds: jest.Mock; listAll: jest.Mock };
  accounts: { add: jest.Mock };
} => {
  const banks = { findManyByIds: jest.fn(), listAll: jest.fn() };
  const accounts = {
    add: jest.fn().mockImplementation((input: { bankId: string }) =>
      Promise.resolve({
        id: `acc-${input.bankId}`,
        userId: 'user-1',
        bankId: input.bankId,
        nickname: 'x',
        balance: 0,
        creditLimit: null,
        overdraftLimit: null,
        closeDay: null,
        dueDay: null,
      }),
    ),
  };
  const useCase = new AddUserBanksUseCase(banks, accounts);
  return { useCase, banks, accounts };
};

describe('AddUserBanksUseCase', () => {
  it('cria uma conta pra cada bank encontrado com nickname=nome canônico e saldo 0', async () => {
    const { useCase, banks, accounts } = buildUseCase();
    banks.findManyByIds.mockResolvedValue([
      bank('id-nubank', 'Nubank'),
      bank('id-picpay', 'PicPay'),
      bank('id-btg', 'BTG Pactual'),
    ]);

    const result = await useCase.execute({
      userId: 'user-1',
      bankIds: ['id-nubank', 'id-picpay', 'id-btg'],
    });

    expect(result.notFound).toEqual([]);
    expect(result.created).toEqual([
      { accountId: 'acc-id-nubank', bankName: 'Nubank' },
      { accountId: 'acc-id-picpay', bankName: 'PicPay' },
      { accountId: 'acc-id-btg', bankName: 'BTG Pactual' },
    ]);
    expect(banks.findManyByIds).toHaveBeenCalledWith([
      'id-nubank',
      'id-picpay',
      'id-btg',
    ]);
    expect(accounts.add).toHaveBeenNthCalledWith(1, {
      userId: 'user-1',
      bankId: 'id-nubank',
      nickname: 'Nubank',
      initialBalance: 0,
    });
  });

  it('coloca em notFound os IDs que o catálogo não conhece', async () => {
    const { useCase, banks, accounts } = buildUseCase();
    banks.findManyByIds.mockResolvedValue([bank('id-nubank', 'Nubank')]);

    const result = await useCase.execute({
      userId: 'user-1',
      bankIds: ['id-nubank', 'id-fake', 'id-outro-fake'],
    });

    expect(result.created).toHaveLength(1);
    expect(result.notFound).toEqual(['id-fake', 'id-outro-fake']);
    expect(accounts.add).toHaveBeenCalledTimes(1);
  });

  it('dedupa IDs repetidos na input antes de bater no repo', async () => {
    const { useCase, banks, accounts } = buildUseCase();
    banks.findManyByIds.mockResolvedValue([bank('id-nubank', 'Nubank')]);

    const result = await useCase.execute({
      userId: 'user-1',
      bankIds: ['id-nubank', 'id-nubank', 'id-nubank'],
    });

    expect(banks.findManyByIds).toHaveBeenCalledWith(['id-nubank']);
    expect(result.created).toHaveLength(1);
    expect(accounts.add).toHaveBeenCalledTimes(1);
  });

  it('mistura sucesso e IDs inválidos na mesma chamada', async () => {
    const { useCase, banks } = buildUseCase();
    banks.findManyByIds.mockResolvedValue([
      bank('id-nubank', 'Nubank'),
      bank('id-picpay', 'PicPay'),
    ]);

    const result = await useCase.execute({
      userId: 'user-1',
      bankIds: ['id-nubank', 'id-fake', 'id-picpay'],
    });

    expect(result.created.map((c) => c.bankName)).toEqual(['Nubank', 'PicPay']);
    expect(result.notFound).toEqual(['id-fake']);
  });
});
