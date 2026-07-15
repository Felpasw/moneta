import { LoginWithPasswordUseCase } from '~/auth/application/use-cases/login-with-password.use-case';
import { InvalidCredentialsError } from '~/auth/domain/errors/invalid-credentials.error';
import type { CreateSessionInput } from '~/auth/domain/ports/sessions-repository';

const NOW = new Date('2026-07-15T12:00:00Z');
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

const buildUseCase = () => {
  const hasher = {
    hash: jest.fn(),
    verify: jest.fn().mockResolvedValue(true),
  };
  const tokens = {
    signAccess: jest.fn().mockReturnValue('access.jwt'),
    verifyAccess: jest.fn(),
    signRefresh: jest.fn().mockReturnValue('refresh.jwt'),
    verifyRefresh: jest.fn(),
  };
  const users = {
    createWithPasswordCredential: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByEmailWithPasswordCredential: jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
      passwordHash: 'stored-hash',
    }),
  };
  const sessions = {
    create: jest.fn().mockImplementation(() =>
      Promise.resolve({
        id: 'session-1',
        userId: 'user-1',
        createdAt: NOW,
        expiresAt: new Date(NOW.getTime() + REFRESH_TTL_SECONDS * 1000),
      }),
    ),
  };
  const clock = {
    now: jest.fn().mockReturnValue(NOW),
  };

  const useCase = new LoginWithPasswordUseCase(
    hasher,
    tokens,
    users,
    sessions,
    clock,
  );

  return { useCase, hasher, tokens, users, sessions, clock };
};

describe('LoginWithPasswordUseCase', () => {
  it('returns tokens + user snapshot on successful login', async () => {
    const { useCase } = buildUseCase();
    const result = await useCase.execute({
      email: 'Alice@Example.com',
      password: 'plaintext',
      userAgent: 'jest',
      ip: '127.0.0.1',
    });

    expect(result).toEqual({
      user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
    });
  });

  it('normalizes email to lowercase before the repository lookup', async () => {
    const { useCase, users } = buildUseCase();
    await useCase.execute({
      email: '  Alice@Example.COM  ',
      password: 'plaintext',
    });
    expect(users.findByEmailWithPasswordCredential).toHaveBeenCalledWith(
      'alice@example.com',
    );
  });

  it('verifies the plaintext password against the stored hash', async () => {
    const { useCase, hasher } = buildUseCase();
    await useCase.execute({
      email: 'alice@example.com',
      password: 'plaintext',
    });
    expect(hasher.verify).toHaveBeenCalledWith('stored-hash', 'plaintext');
  });

  it('persists a session with the sha256 of the refresh token and 30d expiry', async () => {
    const { useCase, sessions } = buildUseCase();
    await useCase.execute({
      email: 'alice@example.com',
      password: 'plaintext',
      userAgent: 'jest',
      ip: '127.0.0.1',
    });

    const calls = sessions.create.mock.calls as unknown as [
      [CreateSessionInput],
    ];
    const call = calls[0][0];
    expect(call.userId).toBe('user-1');
    expect(call.userAgent).toBe('jest');
    expect(call.ip).toBe('127.0.0.1');
    expect(call.expiresAt.getTime()).toBe(
      NOW.getTime() + REFRESH_TTL_SECONDS * 1000,
    );
    expect(call.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(call.refreshTokenHash).not.toBe('refresh.jwt');
  });

  it('signs the access token with { sub: userId }', async () => {
    const { useCase, tokens } = buildUseCase();
    await useCase.execute({
      email: 'alice@example.com',
      password: 'plaintext',
    });
    expect(tokens.signAccess).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(tokens.signRefresh).toHaveBeenCalledWith({ sub: 'user-1' });
  });

  it('throws InvalidCredentialsError when the user does not exist', async () => {
    const { useCase, users, hasher, sessions, tokens } = buildUseCase();
    users.findByEmailWithPasswordCredential.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'ghost@example.com', password: 'p' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(hasher.verify).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
    expect(tokens.signAccess).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when the password does not match', async () => {
    const { useCase, hasher, sessions, tokens } = buildUseCase();
    hasher.verify.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'wrong' }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(sessions.create).not.toHaveBeenCalled();
    expect(tokens.signAccess).not.toHaveBeenCalled();
  });

  it('accepts missing userAgent and ip (mobile without request context)', async () => {
    const { useCase, sessions } = buildUseCase();
    await useCase.execute({
      email: 'alice@example.com',
      password: 'plaintext',
    });
    const calls = sessions.create.mock.calls as unknown as [
      [CreateSessionInput],
    ];
    const call = calls[0][0];
    expect(call.userAgent).toBeUndefined();
    expect(call.ip).toBeUndefined();
  });
});
