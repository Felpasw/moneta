import { SetNicknameTool } from '~/agent/tools/onboarding/set-nickname.tool';
import type { UsersService } from '~/users/users.service';

const CTX = { userId: 'user-1', requestId: 'req-1' };

const buildTool = (): {
  tool: SetNicknameTool;
  users: { updateNickname: jest.Mock };
} => {
  const users = { updateNickname: jest.fn() };
  const tool = new SetNicknameTool(users as unknown as UsersService);
  return { tool, users };
};

describe('SetNicknameTool', () => {
  it('atualiza o nickname via UsersService e retorna ok/data', async () => {
    const { tool, users } = buildTool();
    users.updateNickname.mockResolvedValue({ nickname: 'Felps' });

    const result = await tool.execute({ nickname: 'Felps' }, CTX);

    expect(result).toEqual({ ok: true, data: { nickname: 'Felps' } });
    expect(users.updateNickname).toHaveBeenCalledWith('user-1', 'Felps');
  });

  it('rejeita nickname vazio sem chamar o service', async () => {
    const { tool, users } = buildTool();

    const result = await tool.execute({ nickname: '' }, CTX);

    expect(result.ok).toBe(false);
    expect(users.updateNickname).not.toHaveBeenCalled();
  });

  it('rejeita nickname acima de 50 caracteres sem chamar o service', async () => {
    const { tool, users } = buildTool();
    const tooLong = 'x'.repeat(51);

    const result = await tool.execute({ nickname: tooLong }, CTX);

    expect(result.ok).toBe(false);
    expect(users.updateNickname).not.toHaveBeenCalled();
  });

  it('rejeita quando nickname não é string', async () => {
    const { tool, users } = buildTool();

    const result = await tool.execute({ nickname: 42 }, CTX);

    expect(result.ok).toBe(false);
    expect(users.updateNickname).not.toHaveBeenCalled();
  });
});
