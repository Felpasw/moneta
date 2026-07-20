import { DeleteTransferUseCase } from '~/transfers/application/use-cases/delete-transfer.use-case';
import { TransferNotFoundError } from '~/transfers/domain/errors/transfer-not-found.error';

describe('DeleteTransferUseCase', () => {
  it('delegates delete to the repository', async () => {
    const transfers = { create: jest.fn(), list: jest.fn(), delete: jest.fn() };
    const useCase = new DeleteTransferUseCase(transfers);
    transfers.delete.mockResolvedValue(undefined);

    await useCase.execute({ id: 'tr-1', userId: 'user-1' });

    expect(transfers.delete).toHaveBeenCalledWith('tr-1', 'user-1');
  });

  it('propagates TransferNotFoundError from the repository', async () => {
    const transfers = { create: jest.fn(), list: jest.fn(), delete: jest.fn() };
    const useCase = new DeleteTransferUseCase(transfers);
    transfers.delete.mockRejectedValue(new TransferNotFoundError('tr-1'));

    await expect(
      useCase.execute({ id: 'tr-1', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(TransferNotFoundError);
  });
});
