import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { CreateTransferUseCase } from '~/finance/transfers/application/use-cases/create-transfer.use-case';
import { TRANSFER_CREATED_EVENT } from '~/finance/transfers/domain/events/transfer-created.event';
import { SameAccountTransferError } from '~/finance/transfers/domain/errors/same-account-transfer.error';

const buildUseCase = () => {
  const transfers = { create: jest.fn(), list: jest.fn(), delete: jest.fn() };
  const events = { emit: jest.fn() };
  const useCase = new CreateTransferUseCase(transfers, events as never);
  return { useCase, transfers, events };
};

const BASE_INPUT = {
  userId: 'user-1',
  fromAccountId: 'acc-a',
  toAccountId: 'acc-b',
  amount: 100,
  occurredAt: new Date('2026-07-15T12:00:00Z'),
};

describe('CreateTransferUseCase', () => {
  it('delegates to the repository, emits transfer.created and returns the record', async () => {
    const { useCase, transfers, events } = buildUseCase();
    const created = { id: 'tr-1', ...BASE_INPUT, description: null };
    transfers.create.mockResolvedValue(created);

    const result = await useCase.execute(BASE_INPUT);

    expect(result).toEqual(created);
    expect(transfers.create).toHaveBeenCalledWith(BASE_INPUT);
    expect(events.emit).toHaveBeenCalledWith(TRANSFER_CREATED_EVENT, {
      transferId: 'tr-1',
      userId: BASE_INPUT.userId,
      fromAccountId: BASE_INPUT.fromAccountId,
      toAccountId: BASE_INPUT.toAccountId,
      amount: BASE_INPUT.amount,
      occurredAt: BASE_INPUT.occurredAt,
    });
  });

  it('rejects when fromAccountId equals toAccountId (does NOT emit)', async () => {
    const { useCase, transfers, events } = buildUseCase();

    await expect(
      useCase.execute({
        ...BASE_INPUT,
        fromAccountId: 'acc-a',
        toAccountId: 'acc-a',
      }),
    ).rejects.toBeInstanceOf(SameAccountTransferError);
    expect(transfers.create).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('propagates AccountNotFoundError from the repository (does NOT emit)', async () => {
    const { useCase, transfers, events } = buildUseCase();
    transfers.create.mockRejectedValue(new AccountNotFoundError('acc-a'));

    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(
      AccountNotFoundError,
    );
    expect(events.emit).not.toHaveBeenCalled();
  });
});
