import { UpdateBankAccountTool } from '~/agent/tools/accounts/update-bank-account.tool';
import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';

const CTX = { userId: 'user-1', requestId: 'req-1' };
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildTool = () => {
  const updateBankAccount = { execute: jest.fn() };
  const tool = new UpdateBankAccountTool(updateBankAccount as never);
  return { tool, updateBankAccount };
};

describe('UpdateBankAccountTool', () => {
  it('updates the nickname and returns the fresh snapshot', async () => {
    const { tool, updateBankAccount } = buildTool();
    const updated = { id: ACCOUNT_ID, nickname: 'Novo' };
    updateBankAccount.execute.mockResolvedValue(updated);

    const result = await tool.execute(
      { id: ACCOUNT_ID, nickname: 'Novo' },
      CTX,
    );

    expect(result).toEqual({ ok: true, data: updated });
    expect(updateBankAccount.execute).toHaveBeenCalledWith({
      id: ACCOUNT_ID,
      userId: 'user-1',
      nickname: 'Novo',
    });
  });

  it('returns ok:false when the use-case throws AccountNotFoundError', async () => {
    const { tool, updateBankAccount } = buildTool();
    updateBankAccount.execute.mockRejectedValue(
      new AccountNotFoundError(ACCOUNT_ID),
    );

    const result = await tool.execute({ id: ACCOUNT_ID, nickname: 'x' }, CTX);

    expect(result.ok).toBe(false);
    expect(result.error).toContain(ACCOUNT_ID);
  });

  it('returns ok:false when input lacks the required id', async () => {
    const { tool, updateBankAccount } = buildTool();

    const result = await tool.execute({ nickname: 'x' }, CTX);

    expect(result.ok).toBe(false);
    expect(updateBankAccount.execute).not.toHaveBeenCalled();
  });

  describe('playbook — omit vs null semantics', () => {
    it('exposes name update_bank_account with non-empty playbook', () => {
      const { tool } = buildTool();

      expect(tool.name).toBe('update_bank_account');
      expect(tool.playbook).toEqual(expect.any(String));
      expect(tool.playbook.length).toBeGreaterThan(0);
    });

    it('teaches the LLM to OMIT unchanged fields instead of sending null', () => {
      const { tool } = buildTool();

      expect(tool.playbook.toLowerCase()).toMatch(/omit/i);
    });

    it('states that null means intentional removal, not "leave as is"', () => {
      const { tool } = buildTool();

      expect(tool.playbook).toMatch(/remo[çc]ão intencional/i);
    });

    it('warns against sending null by default for unchanged fields', () => {
      const { tool } = buildTool();

      expect(tool.playbook).toMatch(
        /nunca envie null (por )?default|nunca.*null.*campo.*inalterado/i,
      );
    });
  });
});
