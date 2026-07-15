import { SignOutEverywhereUseCase } from '~/auth/application/use-cases/sign-out-everywhere.use-case';

const NOW = new Date('2026-07-15T12:00:00Z');

const buildUseCase = () => {
  const sessions = {
    create: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    rotate: jest.fn(),
    revokeByRefreshTokenHash: jest.fn(),
    revokeAllByUserId: jest.fn().mockResolvedValue(undefined),
  };
  const clock = { now: jest.fn().mockReturnValue(NOW) };

  const useCase = new SignOutEverywhereUseCase(sessions, clock);
  return { useCase, sessions, clock };
};

describe('SignOutEverywhereUseCase', () => {
  it('revokes all sessions of the given user with clock.now() as revokedAt', async () => {
    const { useCase, sessions } = buildUseCase();
    await useCase.execute({ userId: 'user-1' });

    expect(sessions.revokeAllByUserId).toHaveBeenCalledWith('user-1', NOW);
  });

  it('is idempotent — resolves silently when no sessions match', async () => {
    const { useCase, sessions } = buildUseCase();
    sessions.revokeAllByUserId.mockResolvedValue(undefined);

    await expect(
      useCase.execute({ userId: 'user-with-no-sessions' }),
    ).resolves.toBeUndefined();
  });

  it('reads the current time from the injected Clock', async () => {
    const { useCase, clock } = buildUseCase();
    await useCase.execute({ userId: 'user-1' });
    expect(clock.now).toHaveBeenCalledTimes(1);
  });
});
