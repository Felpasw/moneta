import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { ListTransactionsTool } from '~/agent/tools/transactions/list-transactions.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = () => {
  const listTransactions = { execute: jest.fn() };
  const tool = new ListTransactionsTool(listTransactions as never);
  return { tool, listTransactions };
};

describe('ListTransactionsTool', () => {
  it('lists transactions with the given filters + userId from ctx', async () => {
    const { tool, listTransactions } = buildTool();
    const rows = [{ id: 't-1' }];
    listTransactions.execute.mockResolvedValue(rows);

    const result = await tool.execute(
      {
        dateFrom: '2026-07-01T00:00:00.000Z',
        dateTo: '2026-07-31T23:59:59.000Z',
        types: ['expense'],
        limit: 25,
      },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: rows });
    expect(listTransactions.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00.000Z'),
      dateTo: new Date('2026-07-31T23:59:59.000Z'),
      types: [TransactionType.Expense],
      limit: 25,
      offset: 0,
    });
  });

  it('applies default limit and offset when none provided', async () => {
    const { tool, listTransactions } = buildTool();
    listTransactions.execute.mockResolvedValue([]);

    await tool.execute({}, CTX);

    expect(listTransactions.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      limit: 50,
      offset: 0,
    });
  });
});
