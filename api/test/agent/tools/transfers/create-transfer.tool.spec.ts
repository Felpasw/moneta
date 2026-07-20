import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';
import { SameAccountTransferError } from '~/transfers/domain/errors/same-account-transfer.error';
import { CreateTransferTool } from '~/agent/tools/transfers/create-transfer.tool';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const FROM_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const TO_ID = 'a4b1c1e0-0000-4000-8000-000000000002';
const OCCURRED_AT = '2026-07-15T12:00:00.000Z';

const buildTool = () => {
  const createTransfer = { execute: jest.fn() };
  const tool = new CreateTransferTool(createTransfer as never);
  return { tool, createTransfer };
};

describe('CreateTransferTool', () => {
  it('creates a transfer and returns it', async () => {
    const { tool, createTransfer } = buildTool();
    const created = {
      id: 'tr-1',
      userId: 'user-1',
      fromAccountId: FROM_ID,
      toAccountId: TO_ID,
      amount: 150,
      description: null,
      occurredAt: OCCURRED_AT,
    };
    createTransfer.execute.mockResolvedValue(created);

    const result = await tool.execute(
      {
        fromAccountId: FROM_ID,
        toAccountId: TO_ID,
        amount: 150,
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: created });
    expect(createTransfer.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      fromAccountId: FROM_ID,
      toAccountId: TO_ID,
      amount: 150,
      occurredAt: new Date(OCCURRED_AT),
    });
  });

  it('returns ok:false when fromAccountId equals toAccountId', async () => {
    const { tool, createTransfer } = buildTool();
    createTransfer.execute.mockRejectedValue(
      new SameAccountTransferError(FROM_ID),
    );

    const result = await tool.execute(
      {
        fromAccountId: FROM_ID,
        toAccountId: FROM_ID,
        amount: 10,
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(result.ok).toBe(false);
  });

  it('returns ok:false when one of the accounts is not owned', async () => {
    const { tool, createTransfer } = buildTool();
    createTransfer.execute.mockRejectedValue(new AccountNotFoundError(FROM_ID));

    const result = await tool.execute(
      {
        fromAccountId: FROM_ID,
        toAccountId: TO_ID,
        amount: 10,
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(result.ok).toBe(false);
  });

  it('returns ok:false when input fails validation (negative amount)', async () => {
    const { tool, createTransfer } = buildTool();

    const result = await tool.execute(
      {
        fromAccountId: FROM_ID,
        toAccountId: TO_ID,
        amount: -1,
        occurredAt: OCCURRED_AT,
      },
      CTX,
    );

    expect(result.ok).toBe(false);
    expect(createTransfer.execute).not.toHaveBeenCalled();
  });
});
