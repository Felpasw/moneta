import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';
import { CreateTransferUseCase } from '~/transfers/application/use-cases/create-transfer.use-case';
import { SameAccountTransferError } from '~/transfers/domain/errors/same-account-transfer.error';

const buildUseCase = () => {
  const transfers = { create: jest.fn(), list: jest.fn(), delete: jest.fn() };
  const useCase = new CreateTransferUseCase(transfers);
  return { useCase, transfers };
};

const BASE_INPUT = {
  userId: 'user-1',
  fromAccountId: 'acc-a',
  toAccountId: 'acc-b',
  amount: 100,
  occurredAt: new Date('2026-07-15T12:00:00Z'),
};

describe('CreateTransferUseCase', () => {
  it('delegates to the repository and returns the created transfer', async () => {
    const { useCase, transfers } = buildUseCase();
    const created = { id: 'tr-1', ...BASE_INPUT, description: null };
    transfers.create.mockResolvedValue(created);

    const result = await useCase.execute(BASE_INPUT);

    expect(result).toEqual(created);
    expect(transfers.create).toHaveBeenCalledWith(BASE_INPUT);
  });

  it('rejects when fromAccountId equals toAccountId', async () => {
    const { useCase, transfers } = buildUseCase();

    await expect(
      useCase.execute({
        ...BASE_INPUT,
        fromAccountId: 'acc-a',
        toAccountId: 'acc-a',
      }),
    ).rejects.toBeInstanceOf(SameAccountTransferError);
    expect(transfers.create).not.toHaveBeenCalled();
  });

  it('propagates AccountNotFoundError from the repository', async () => {
    const { useCase, transfers } = buildUseCase();
    transfers.create.mockRejectedValue(new AccountNotFoundError('acc-a'));

    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
  });
});
