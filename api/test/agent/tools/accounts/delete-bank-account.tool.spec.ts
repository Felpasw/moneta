import { DeleteBankAccountTool } from '~/agent/tools/accounts/delete-bank-account.tool';
import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildTool = () => {
  const deleteBankAccount = { execute: jest.fn() };
  const tool = new DeleteBankAccountTool(deleteBankAccount as never);
  return { tool, deleteBankAccount };
};

describe('DeleteBankAccountTool', () => {
  it('deletes the account and confirms with ok:true', async () => {
    const { tool, deleteBankAccount } = buildTool();
    deleteBankAccount.execute.mockResolvedValue(undefined);

    const result = await tool.execute({ id: ACCOUNT_ID }, CTX);

    expect(result).toEqual({
      ok: true,
      data: { id: ACCOUNT_ID, deleted: true },
    });
    expect(deleteBankAccount.execute).toHaveBeenCalledWith({
      id: ACCOUNT_ID,
      userId: 'user-1',
    });
  });

  it('returns ok:false when the account is not found', async () => {
    const { tool, deleteBankAccount } = buildTool();
    deleteBankAccount.execute.mockRejectedValue(
      new AccountNotFoundError(ACCOUNT_ID),
    );

    const result = await tool.execute({ id: ACCOUNT_ID }, CTX);

    expect(result.ok).toBe(false);
  });
});
