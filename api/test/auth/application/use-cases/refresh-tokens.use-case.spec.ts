import { RefreshTokensUseCase } from '~/auth/application/use-cases/refresh-tokens.use-case';
import { InvalidRefreshTokenReason } from '~/auth/domain/errors/invalid-refresh-token.error';
import type { CreateSessionInput } from '~/auth/domain/ports/sessions-repository';

const NOW = new Date('2026-07-15T12:00:00Z');
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const FAR_FUTURE = new Date(NOW.getTime() + REFRESH_TTL_SECONDS * 1000);
const PAST = new Date(NOW.getTime() - 60 * 1000);

const REFRESH_TOKEN_INPUT = 'incoming.refresh.jwt';

const activeSession = () => ({
  id: 'session-old',
  userId: 'user-1',
  revokedAt: null,
  expiresAt: FAR_FUTURE,
  user: {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    onboardedAt: null,
  },
});

const buildUseCase = () => {
  const tokens = {
    signAccess: jest.fn().mockReturnValue('new.access.jwt'),
    verifyAccess: jest.fn(),
    signRefresh: jest.fn().mockReturnValue('new.refresh.jwt'),
    verifyRefresh: jest.fn().mockReturnValue({
      sub: 'user-1',
      iat: 0,
      exp: 0,
    }),
  };
  const sessions = {
    create: jest.fn(),
    findByRefreshTokenHash: jest.fn().mockResolvedValue(activeSession()),
    rotate: jest.fn().mockImplementation(() =>
      Promise.resolve({
        id: 'session-new',
        userId: 'user-1',
        createdAt: NOW,
        expiresAt: FAR_FUTURE,
      }),
    ),
  };
  const clock = { now: jest.fn().mockReturnValue(NOW) };

  const useCase = new RefreshTokensUseCase(tokens, sessions, clock);
  return { useCase, tokens, sessions, clock };
};

describe('RefreshTokensUseCase', () => {
  it('returns a new token pair + user snapshot on happy path', async () => {
    const { useCase } = buildUseCase();
    const result = await useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT });

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        onboardedAt: null,
      },
      accessToken: 'new.access.jwt',
      refreshToken: 'new.refresh.jwt',
    });
  });

  it('rotates atomically: revokes previous session and creates new one with sha256 hash', async () => {
    const { useCase, sessions } = buildUseCase();
    await useCase.execute({
      refreshToken: REFRESH_TOKEN_INPUT,
      userAgent: 'jest',
      ip: '127.0.0.1',
    });

    const calls = sessions.rotate.mock.calls as unknown as [
      [{ previousSessionId: string; next: CreateSessionInput; now: Date }],
    ];
    const call = calls[0][0];
    expect(call.previousSessionId).toBe('session-old');
    expect(call.now).toEqual(NOW);
    expect(call.next.userId).toBe('user-1');
    expect(call.next.userAgent).toBe('jest');
    expect(call.next.ip).toBe('127.0.0.1');
    expect(call.next.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(call.next.refreshTokenHash).not.toBe('new.refresh.jwt');
    expect(call.next.expiresAt.getTime()).toBe(
      NOW.getTime() + REFRESH_TTL_SECONDS * 1000,
    );
  });

  it('looks up the previous session by sha256 of the incoming token, not the raw token', async () => {
    const { useCase, sessions } = buildUseCase();
    await useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT });

    const lookupCalls = sessions.findByRefreshTokenHash.mock
      .calls as unknown as [[string]];
    const lookupHash = lookupCalls[0][0];
    expect(lookupHash).toMatch(/^[0-9a-f]{64}$/);
    expect(lookupHash).not.toBe(REFRESH_TOKEN_INPUT);
  });

  it('throws InvalidRefreshTokenError (reason=invalid_signature) when JWT verify fails', async () => {
    const { useCase, tokens, sessions } = buildUseCase();
    tokens.verifyRefresh.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await expect(
      useCase.execute({ refreshToken: 'bad.jwt' }),
    ).rejects.toMatchObject({
      name: 'InvalidRefreshTokenError',
      reason: InvalidRefreshTokenReason.INVALID_SIGNATURE,
    });
    expect(sessions.findByRefreshTokenHash).not.toHaveBeenCalled();
  });

  it('throws InvalidRefreshTokenError (reason=SESSION_NOT_FOUND) when hash is unknown', async () => {
    const { useCase, sessions } = buildUseCase();
    sessions.findByRefreshTokenHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT }),
    ).rejects.toMatchObject({
      name: 'InvalidRefreshTokenError',
      reason: InvalidRefreshTokenReason.SESSION_NOT_FOUND,
    });
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('throws InvalidRefreshTokenError (reason=USER_MISMATCH) when JWT sub differs from session.userId', async () => {
    const { useCase, tokens, sessions } = buildUseCase();
    tokens.verifyRefresh.mockReturnValue({
      sub: 'someone-else',
      iat: 0,
      exp: 0,
    });

    await expect(
      useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT }),
    ).rejects.toMatchObject({
      name: 'InvalidRefreshTokenError',
      reason: InvalidRefreshTokenReason.USER_MISMATCH,
    });
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('throws InvalidRefreshTokenError (reason=SESSION_REVOKED) when session is already revoked', async () => {
    const { useCase, sessions } = buildUseCase();
    sessions.findByRefreshTokenHash.mockResolvedValue({
      ...activeSession(),
      revokedAt: PAST,
    });

    await expect(
      useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT }),
    ).rejects.toMatchObject({
      name: 'InvalidRefreshTokenError',
      reason: InvalidRefreshTokenReason.SESSION_REVOKED,
    });
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('throws InvalidRefreshTokenError (reason=SESSION_EXPIRED) when clock.now() >= session.expiresAt', async () => {
    const { useCase, sessions } = buildUseCase();
    sessions.findByRefreshTokenHash.mockResolvedValue({
      ...activeSession(),
      expiresAt: PAST,
    });

    await expect(
      useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT }),
    ).rejects.toMatchObject({
      name: 'InvalidRefreshTokenError',
      reason: InvalidRefreshTokenReason.SESSION_EXPIRED,
    });
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('signs the new access token with { sub: userId }', async () => {
    const { useCase, tokens } = buildUseCase();
    await useCase.execute({ refreshToken: REFRESH_TOKEN_INPUT });

    expect(tokens.signAccess).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(tokens.signRefresh).toHaveBeenCalledWith({ sub: 'user-1' });
  });
});
