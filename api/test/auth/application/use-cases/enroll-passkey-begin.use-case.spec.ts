import { EnrollPasskeyBeginUseCase } from '~/auth/application/use-cases/enroll-passkey-begin.use-case';
import { PASSKEY_CHALLENGE_TTL_SECONDS } from '~/auth/infrastructure/constants/passkey';

const FAKE_OPTIONS = {
  challenge: 'fake-challenge-abcdef',
  rp: { name: 'Moneta', id: 'localhost' },
  user: { id: 'encoded', name: 'alice@example.com', displayName: 'Alice' },
  pubKeyCredParams: [],
  timeout: 60000,
  attestation: 'none',
  excludeCredentials: [],
};

const buildUseCase = () => {
  const users = {
    createWithPasswordCredential: jest.fn(),
    findByEmailWithPasswordCredential: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      name: 'Alice',
    }),
  };
  const passkeys = {
    findByUserId: jest.fn().mockResolvedValue([]),
  };
  const webauthn = {
    generateRegistrationOptions: jest.fn().mockResolvedValue(FAKE_OPTIONS),
  };
  const ephemeralStore = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    getAndDelete: jest.fn(),
    delete: jest.fn(),
  };

  const useCase = new EnrollPasskeyBeginUseCase(
    users,
    passkeys,
    webauthn,
    ephemeralStore,
  );

  return { useCase, users, passkeys, webauthn, ephemeralStore };
};

describe('EnrollPasskeyBeginUseCase', () => {
  it('returns the WebAuthn registration options', async () => {
    const { useCase } = buildUseCase();
    const result = await useCase.execute({ userId: 'user-1' });
    expect(result).toEqual(FAKE_OPTIONS);
  });

  it('generates options with the user email and display name', async () => {
    const { useCase, webauthn } = buildUseCase();
    await useCase.execute({ userId: 'user-1' });

    const calls = webauthn.generateRegistrationOptions.mock
      .calls as unknown as [
      [
        {
          userName: string;
          userDisplayName: string;
          rpID: string;
          rpName: string;
        },
      ],
    ];
    const arg = calls[0][0];
    expect(arg.userName).toBe('alice@example.com');
    expect(arg.userDisplayName).toBe('Alice');
    expect(arg.rpID).toBe('localhost');
    expect(arg.rpName).toBe('Moneta');
  });

  it('passes the user existing credentials as excludeCredentials', async () => {
    const { useCase, passkeys, webauthn } = buildUseCase();
    passkeys.findByUserId.mockResolvedValue([
      { credentialId: 'cred-1', transports: ['internal'] },
      { credentialId: 'cred-2', transports: ['usb'] },
    ]);

    await useCase.execute({ userId: 'user-1' });

    const calls = webauthn.generateRegistrationOptions.mock
      .calls as unknown as [
      [{ excludeCredentials: { id: string; transports?: string[] }[] }],
    ];
    const arg = calls[0][0];
    expect(arg.excludeCredentials).toEqual([
      { id: 'cred-1', transports: ['internal'] },
      { id: 'cred-2', transports: ['usb'] },
    ]);
  });

  it('stores the challenge in ephemeral store with TTL', async () => {
    const { useCase, ephemeralStore } = buildUseCase();
    await useCase.execute({ userId: 'user-1' });

    expect(ephemeralStore.set).toHaveBeenCalledWith(
      'passkey_challenge:enroll:user-1',
      { challenge: 'fake-challenge-abcdef' },
      PASSKEY_CHALLENGE_TTL_SECONDS,
    );
  });

  it('throws when the user does not exist', async () => {
    const { useCase, users, webauthn, ephemeralStore } = buildUseCase();
    users.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'ghost' })).rejects.toThrow();
    expect(webauthn.generateRegistrationOptions).not.toHaveBeenCalled();
    expect(ephemeralStore.set).not.toHaveBeenCalled();
  });
});
