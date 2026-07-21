import { ListTransfersTool } from '~/agent/tools/transfers/list-transfers.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const FROM_ID = 'a4b1c1e0-0000-4000-8000-000000000001';

const buildTool = () => {
  const listTransfers = { execute: jest.fn() };
  const tool = new ListTransfersTool(listTransfers as never);
  return { tool, listTransfers };
};

describe('ListTransfersTool', () => {
  it('lists transfers with the given filters + userId from ctx', async () => {
    const { tool, listTransfers } = buildTool();
    const rows = [{ id: 'tr-1' }];
    listTransfers.execute.mockResolvedValue(rows);

    const result = await tool.execute(
      {
        dateFrom: '2026-07-01T00:00:00.000Z',
        dateTo: '2026-07-31T23:59:59.000Z',
        accountIds: [FROM_ID],
        limit: 25,
      },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: rows });
    expect(listTransfers.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      dateFrom: new Date('2026-07-01T00:00:00.000Z'),
      dateTo: new Date('2026-07-31T23:59:59.000Z'),
      accountIds: [FROM_ID],
      limit: 25,
      offset: 0,
    });
  });

  it('applies default limit and offset when none provided', async () => {
    const { tool, listTransfers } = buildTool();
    listTransfers.execute.mockResolvedValue([]);

    await tool.execute({}, CTX);

    expect(listTransfers.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      limit: 50,
      offset: 0,
    });
  });
});
