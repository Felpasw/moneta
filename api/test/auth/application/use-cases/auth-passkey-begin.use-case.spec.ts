import { AuthPasskeyBeginUseCase } from '~/auth/application/use-cases/auth-passkey-begin.use-case';
import { PASSKEY_CHALLENGE_TTL_SECONDS } from '~/auth/infrastructure/constants/passkey';

const FAKE_OPTIONS = {
  challenge: 'auth-challenge-xyz',
  rpId: 'localhost',
  timeout: 60000,
  allowCredentials: [] as unknown[],
};

const buildUseCase = () => {
  const users = {
    createWithPasswordCredential: jest.fn(),
    findByEmailWithPasswordCredential: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };
  const passkeys = {
    findByUserId: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
  };
  const webauthn = {
    generateRegistrationOptions: jest.fn(),
    verifyRegistrationResponse: jest.fn(),
    generateAuthenticationOptions: jest.fn().mockResolvedValue(FAKE_OPTIONS),
  };
  const ephemeralStore = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    getAndDelete: jest.fn(),
    delete: jest.fn(),
  };

  const useCase = new AuthPasskeyBeginUseCase(
    users,
    passkeys,
    webauthn,
    ephemeralStore,
  );

  return { useCase, users, passkeys, webauthn, ephemeralStore };
};

describe('AuthPasskeyBeginUseCase', () => {
  it('returns an opaque sessionId (UUID) and the WebAuthn auth options', async () => {
    const { useCase } = buildUseCase();
    const result = await useCase.execute({});

    expect(result.options).toEqual(FAKE_OPTIONS);
    expect(result.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('defaults to usernameless — allowCredentials empty when no email is provided', async () => {
    const { useCase, users, passkeys, webauthn } = buildUseCase();
    await useCase.execute({});

    expect(users.findByEmail).not.toHaveBeenCalled();
    expect(passkeys.findByUserId).not.toHaveBeenCalled();
    const calls = webauthn.generateAuthenticationOptions.mock
      .calls as unknown as [
      [{ rpID: string; allowCredentials: { id: string }[] }],
    ];
    expect(calls[0][0].allowCredentials).toEqual([]);
    expect(calls[0][0].rpID).toBe('localhost');
  });

  it('hints allowCredentials with the user credentials when email is provided', async () => {
    const { useCase, users, passkeys, webauthn } = buildUseCase();
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
    });
    passkeys.findByUserId.mockResolvedValue([
      { credentialId: 'cred-a', transports: ['internal'] },
      { credentialId: 'cred-b', transports: ['usb'] },
    ]);

    await useCase.execute({ email: 'Alice@Example.com' });

    expect(users.findByEmail).toHaveBeenCalledWith('alice@example.com');
    const calls = webauthn.generateAuthenticationOptions.mock
      .calls as unknown as [
      [{ allowCredentials: { id: string; transports?: string[] }[] }],
    ];
    expect(calls[0][0].allowCredentials).toEqual([
      { id: 'cred-a', transports: ['internal'] },
      { id: 'cred-b', transports: ['usb'] },
    ]);
  });

  it('falls back to usernameless when the email does not exist (no enumeration leak)', async () => {
    const { useCase, users, passkeys, webauthn } = buildUseCase();
    users.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: 'ghost@example.com' });

    expect(result.sessionId).toBeDefined();
    expect(passkeys.findByUserId).not.toHaveBeenCalled();
    const calls = webauthn.generateAuthenticationOptions.mock
      .calls as unknown as [[{ allowCredentials: { id: string }[] }]];
    expect(calls[0][0].allowCredentials).toEqual([]);
  });

  it('persists the challenge keyed by the generated sessionId with TTL', async () => {
    const { useCase, ephemeralStore } = buildUseCase();
    const result = await useCase.execute({});

    expect(ephemeralStore.set).toHaveBeenCalledWith(
      `passkey_challenge:auth:${result.sessionId}`,
      { challenge: 'auth-challenge-xyz' },
      PASSKEY_CHALLENGE_TTL_SECONDS,
    );
  });

  it('produces a distinct sessionId for each call', async () => {
    const { useCase } = buildUseCase();
    const a = await useCase.execute({});
    const b = await useCase.execute({});
    expect(a.sessionId).not.toBe(b.sessionId);
  });
});
