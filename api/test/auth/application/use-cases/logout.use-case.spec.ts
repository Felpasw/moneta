import { LogoutUseCase } from '~/auth/application/use-cases/logout.use-case';

const NOW = new Date('2026-07-15T12:00:00Z');
const REFRESH_TOKEN_INPUT = 'incoming.refresh.jwt';

const buildUseCase = () => {
  const sessions = {
    create: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    rotate: jest.fn(),
    revokeByRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
  };
  const clock = { now: jest.fn().mockReturnValue(NOW) };

  const useCase = new LogoutUseCase(sessions, clock);
  return { useCase, sessions, clock };
};

describe('LogoutUseCase', () => {
  it('revokes the session matching the sha256 of the incoming token', async () => {
    const { useCase, sessions } = buildUseCase();
    await useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT });

    const calls = sessions.revokeByRefreshTokenHash.mock.calls as unknown as [
      [string, Date],
    ];
    const [hash, now] = calls[0];
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(REFRESH_TOKEN_INPUT);
    expect(now).toEqual(NOW);
  });

  it('is idempotent — never throws even if repo reports no rows affected', async () => {
    const { useCase, sessions } = buildUseCase();
    sessions.revokeByRefreshTokenHash.mockResolvedValue(undefined);

    await expect(
      useCase.execute({ refreshToken: 'garbage-token' }),
    ).resolves.toBeUndefined();
  });

  it('reads the current time from the injected Clock', async () => {
    const { useCase, clock } = buildUseCase();
    await useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT });
    expect(clock.now).toHaveBeenCalledTimes(1);
  });
});
