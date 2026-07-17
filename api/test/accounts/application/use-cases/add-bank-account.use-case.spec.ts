import { AddBankAccountUseCase } from '~/accounts/application/use-cases/add-bank-account.use-case';
import { InvalidCreditCardConfigError } from '~/accounts/domain/errors/invalid-credit-card-config.error';

const buildUseCase = () => {
  const accounts = { add: jest.fn() };
  const useCase = new AddBankAccountUseCase(accounts);
  return { useCase, accounts };
};

const BASE_INPUT = {
  userId: 'user-1',
  bankId: 'bank-1',
  nickname: 'Nubank',
};

describe('AddBankAccountUseCase', () => {
  it('creates a regular account when no credit card fields are provided', async () => {
    const { useCase, accounts } = buildUseCase();
    const created = { id: 'acc-1', ...BASE_INPUT, balance: 0 };
    accounts.add.mockResolvedValue(created);

    const result = await useCase.execute(BASE_INPUT);

    expect(result).toEqual(created);
    expect(accounts.add).toHaveBeenCalledWith(BASE_INPUT);
  });

  it('creates a credit card account when creditLimit + closeDay + dueDay are all provided', async () => {
    const { useCase, accounts } = buildUseCase();
    const input = {
      ...BASE_INPUT,
      creditLimit: 5000,
      closeDay: 10,
      dueDay: 20,
    };
    accounts.add.mockResolvedValue({ id: 'acc-1', ...input, balance: 0 });

    await useCase.execute(input);

    expect(accounts.add).toHaveBeenCalledWith(input);
  });

  it('rejects when creditLimit is present without closeDay', async () => {
    const { useCase, accounts } = buildUseCase();

    await expect(
      useCase.execute({ ...BASE_INPUT, creditLimit: 5000, dueDay: 20 }),
    ).rejects.toBeInstanceOf(InvalidCreditCardConfigError);
    expect(accounts.add).not.toHaveBeenCalled();
  });

  it('rejects when closeDay is present without creditLimit', async () => {
    const { useCase, accounts } = buildUseCase();

    await expect(
      useCase.execute({ ...BASE_INPUT, closeDay: 10, dueDay: 20 }),
    ).rejects.toBeInstanceOf(InvalidCreditCardConfigError);
    expect(accounts.add).not.toHaveBeenCalled();
  });

  it('rejects when dueDay is missing on a credit card account', async () => {
    const { useCase, accounts } = buildUseCase();

    await expect(
      useCase.execute({ ...BASE_INPUT, creditLimit: 5000, closeDay: 10 }),
    ).rejects.toBeInstanceOf(InvalidCreditCardConfigError);
    expect(accounts.add).not.toHaveBeenCalled();
  });
});
