import { AuthPasskeyFinishUseCase } from '~/auth/application/use-cases/auth-passkey-finish.use-case';
import type { CreateSessionInput } from '~/auth/domain/ports/sessions-repository';

const NOW = new Date('2026-07-15T12:00:00Z');
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const CHALLENGE = 'stored-auth-challenge';
const STORED_COUNTER = 5;
const NEW_COUNTER = 6;

const RESPONSE_STUB = { id: 'credential-1', payload: 'anything' };

const buildUseCase = () => {
  const passkeys = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    findByCredentialId: jest.fn().mockResolvedValue({
      credentialId: 'credential-1',
      userId: 'user-1',
      publicKey: new Uint8Array([1, 2, 3]),
      counter: STORED_COUNTER,
      transports: ['internal'],
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        onboardedAt: null,
      },
    }),
    updateCounter: jest.fn().mockResolvedValue(undefined),
  };
  const tokens = {
    signAccess: jest.fn().mockReturnValue('access.jwt'),
    verifyAccess: jest.fn(),
    signRefresh: jest.fn().mockReturnValue('refresh.jwt'),
    verifyRefresh: jest.fn(),
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
    findByRefreshTokenHash: jest.fn(),
    rotate: jest.fn(),
    revokeByRefreshTokenHash: jest.fn(),
  };
  const webauthn = {
    generateRegistrationOptions: jest.fn(),
    verifyRegistrationResponse: jest.fn(),
    generateAuthenticationOptions: jest.fn(),
    verifyAuthenticationResponse: jest.fn().mockResolvedValue({
      verified: true,
      newCounter: NEW_COUNTER,
    }),
  };
  const ephemeralStore = {
    get: jest.fn(),
    set: jest.fn(),
    getAndDelete: jest.fn().mockResolvedValue({ challenge: CHALLENGE }),
    delete: jest.fn(),
  };
  const clock = { now: jest.fn().mockReturnValue(NOW) };

  const useCase = new AuthPasskeyFinishUseCase(
    passkeys,
    tokens,
    sessions,
    webauthn,
    ephemeralStore,
    clock,
  );

  return {
    useCase,
    passkeys,
    tokens,
    sessions,
    webauthn,
    ephemeralStore,
    clock,
  };
};

describe('AuthPasskeyFinishUseCase', () => {
  it('emits a token pair and user snapshot on successful verification', async () => {
    const { useCase } = buildUseCase();
    const result = await useCase.execute({
      sessionId: 'auth-session-uuid',
      response: RESPONSE_STUB,
    });

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        onboardedAt: null,
      },
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
    });
  });

  it('consumes the challenge atomically by sessionId', async () => {
    const { useCase, ephemeralStore } = buildUseCase();
    await useCase.execute({
      sessionId: 'auth-session-uuid',
      response: RESPONSE_STUB,
    });

    expect(ephemeralStore.getAndDelete).toHaveBeenCalledWith(
      'passkey_challenge:auth:auth-session-uuid',
    );
  });

  it('looks up the credential by the id in the response', async () => {
    const { useCase, passkeys } = buildUseCase();
    await useCase.execute({
      sessionId: 'auth-session-uuid',
      response: RESPONSE_STUB,
    });

    expect(passkeys.findByCredentialId).toHaveBeenCalledWith('credential-1');
  });

  it('verifies against the stored publicKey + counter', async () => {
    const { useCase, webauthn } = buildUseCase();
    await useCase.execute({
      sessionId: 'auth-session-uuid',
      response: RESPONSE_STUB,
    });

    const calls = webauthn.verifyAuthenticationResponse.mock
      .calls as unknown as [
      [
        {
          response: unknown;
          expectedChallenge: string;
          expectedOrigin: string;
          expectedRPID: string;
          credential: { id: string; counter: number };
        },
      ],
    ];
    const arg = calls[0][0];
    expect(arg.response).toBe(RESPONSE_STUB);
    expect(arg.expectedChallenge).toBe(CHALLENGE);
    expect(arg.expectedOrigin).toBe('http://localhost:3000');
    expect(arg.expectedRPID).toBe('localhost');
    expect(arg.credential.id).toBe('credential-1');
    expect(arg.credential.counter).toBe(STORED_COUNTER);
  });

  it('updates the credential counter after successful verification', async () => {
    const { useCase, passkeys } = buildUseCase();
    await useCase.execute({
      sessionId: 'auth-session-uuid',
      response: RESPONSE_STUB,
    });

    expect(passkeys.updateCounter).toHaveBeenCalledWith(
      'credential-1',
      NEW_COUNTER,
      NOW,
    );
  });

  it('persists a session with sha256 of the refresh token and 30d expiry', async () => {
    const { useCase, sessions } = buildUseCase();
    await useCase.execute({
      sessionId: 'auth-session-uuid',
      response: RESPONSE_STUB,
      userAgent: 'jest',
      ip: '127.0.0.1',
    });

    const calls = sessions.create.mock.calls as unknown as [
      [CreateSessionInput],
    ];
    const arg = calls[0][0];
    expect(arg.userId).toBe('user-1');
    expect(arg.userAgent).toBe('jest');
    expect(arg.ip).toBe('127.0.0.1');
    expect(arg.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(arg.expiresAt.getTime()).toBe(
      NOW.getTime() + REFRESH_TTL_SECONDS * 1000,
    );
  });

  it('throws CHALLENGE_NOT_FOUND when challenge is missing (expired or replayed)', async () => {
    const { useCase, ephemeralStore, passkeys } = buildUseCase();
    ephemeralStore.getAndDelete.mockResolvedValue(null);

    await expect(
      useCase.execute({ sessionId: 'x', response: RESPONSE_STUB }),
    ).rejects.toMatchObject({
      name: 'PasskeyAuthenticationFailedError',
      reason: 'challenge_not_found',
    });
    expect(passkeys.findByCredentialId).not.toHaveBeenCalled();
  });

  it('throws CREDENTIAL_NOT_FOUND when response has no id', async () => {
    const { useCase, passkeys } = buildUseCase();

    await expect(
      useCase.execute({ sessionId: 'x', response: { id: '' } }),
    ).rejects.toMatchObject({
      name: 'PasskeyAuthenticationFailedError',
      reason: 'credential_not_found',
    });
    expect(passkeys.findByCredentialId).not.toHaveBeenCalled();
  });

  it('throws CREDENTIAL_NOT_FOUND when credentialId is unknown', async () => {
    const { useCase, passkeys, webauthn } = buildUseCase();
    passkeys.findByCredentialId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        sessionId: 'x',
        response: { id: 'ghost-credential' },
      }),
    ).rejects.toMatchObject({
      name: 'PasskeyAuthenticationFailedError',
      reason: 'credential_not_found',
    });
    expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it('throws VERIFICATION_FAILED when the WebAuthn verify returns false', async () => {
    const { useCase, webauthn, passkeys, sessions, tokens } = buildUseCase();
    webauthn.verifyAuthenticationResponse.mockResolvedValue({
      verified: false,
    });

    await expect(
      useCase.execute({ sessionId: 'x', response: RESPONSE_STUB }),
    ).rejects.toMatchObject({
      name: 'PasskeyAuthenticationFailedError',
      reason: 'verification_failed',
    });
    expect(passkeys.updateCounter).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
    expect(tokens.signAccess).not.toHaveBeenCalled();
  });
});
