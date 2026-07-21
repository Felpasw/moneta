import { ListTransfersUseCase } from '~/finance/transfers/application/use-cases/list-transfers.use-case';

describe('ListTransfersUseCase', () => {
  it('forwards filters to the repository and returns the transfers', async () => {
    const transfers = { create: jest.fn(), list: jest.fn(), delete: jest.fn() };
    const useCase = new ListTransfersUseCase(transfers);
    const filters = {
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00Z'),
      accountIds: ['acc-a'],
      limit: 25,
      offset: 0,
    };
    transfers.list.mockResolvedValue([
      {
        id: 'tr-1',
        userId: 'user-1',
        fromAccountId: 'acc-a',
        toAccountId: 'acc-b',
        amount: 50,
        description: null,
        occurredAt: new Date(),
      },
    ]);

    const result = await useCase.execute(filters);

    expect(result).toHaveLength(1);
    expect(transfers.list).toHaveBeenCalledWith(filters);
  });
});
