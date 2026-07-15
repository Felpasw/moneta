import { EnrollPasskeyFinishUseCase } from '~/auth/application/use-cases/enroll-passkey-finish.use-case';
import { PasskeyEnrollmentFailedError } from '~/auth/domain/errors/passkey-enrollment-failed.error';

const CHALLENGE = 'stored-challenge-abc';
const PUBLIC_KEY = new Uint8Array([1, 2, 3, 4]);

const buildUseCase = () => {
  const passkeys = {
    findByUserId: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const webauthn = {
    generateRegistrationOptions: jest.fn(),
    verifyRegistrationResponse: jest.fn().mockResolvedValue({
      verified: true,
      credential: {
        credentialId: 'new-credential-id',
        publicKey: PUBLIC_KEY,
        counter: 0,
        transports: ['internal', 'hybrid'],
        deviceType: 'multiDevice',
        backedUp: true,
      },
    }),
  };
  const ephemeralStore = {
    get: jest.fn(),
    set: jest.fn(),
    getAndDelete: jest.fn().mockResolvedValue({ challenge: CHALLENGE }),
    delete: jest.fn(),
  };

  const useCase = new EnrollPasskeyFinishUseCase(
    passkeys,
    webauthn,
    ephemeralStore,
  );

  return { useCase, passkeys, webauthn, ephemeralStore };
};

const RESPONSE_STUB = { id: 'attestation-response' };

describe('EnrollPasskeyFinishUseCase', () => {
  it('creates the PasskeyCredential on successful verification', async () => {
    const { useCase, passkeys } = buildUseCase();
    await useCase.execute({ userId: 'user-1', response: RESPONSE_STUB });

    expect(passkeys.create).toHaveBeenCalledWith({
      userId: 'user-1',
      credentialId: 'new-credential-id',
      publicKey: PUBLIC_KEY,
      counter: 0,
      transports: ['internal', 'hybrid'],
      deviceType: 'multiDevice',
      backedUp: true,
    });
  });

  it('consumes the challenge atomically via getAndDelete (single-use)', async () => {
    const { useCase, ephemeralStore } = buildUseCase();
    await useCase.execute({ userId: 'user-1', response: RESPONSE_STUB });

    expect(ephemeralStore.getAndDelete).toHaveBeenCalledWith(
      'passkey_challenge:enroll:user-1',
    );
  });

  it('passes the expected challenge, origin and rpID to the verifier', async () => {
    const { useCase, webauthn } = buildUseCase();
    await useCase.execute({ userId: 'user-1', response: RESPONSE_STUB });

    const calls = webauthn.verifyRegistrationResponse.mock.calls as unknown as [
      [
        {
          response: unknown;
          expectedChallenge: string;
          expectedOrigin: string;
          expectedRPID: string;
        },
      ],
    ];
    const arg = calls[0][0];
    expect(arg.response).toBe(RESPONSE_STUB);
    expect(arg.expectedChallenge).toBe(CHALLENGE);
    expect(arg.expectedRPID).toBe('localhost');
    expect(arg.expectedOrigin).toBe('http://localhost:3000');
  });

  it('throws PasskeyEnrollmentFailedError when challenge is missing (already consumed or expired)', async () => {
    const { useCase, ephemeralStore, webauthn, passkeys } = buildUseCase();
    ephemeralStore.getAndDelete.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', response: RESPONSE_STUB }),
    ).rejects.toBeInstanceOf(PasskeyEnrollmentFailedError);
    expect(webauthn.verifyRegistrationResponse).not.toHaveBeenCalled();
    expect(passkeys.create).not.toHaveBeenCalled();
  });

  it('throws PasskeyEnrollmentFailedError when verify returns verified=false', async () => {
    const { useCase, webauthn, passkeys } = buildUseCase();
    webauthn.verifyRegistrationResponse.mockResolvedValue({
      verified: false,
    });

    await expect(
      useCase.execute({ userId: 'user-1', response: RESPONSE_STUB }),
    ).rejects.toBeInstanceOf(PasskeyEnrollmentFailedError);
    expect(passkeys.create).not.toHaveBeenCalled();
  });

  it('throws PasskeyEnrollmentFailedError when verify returns no credential (defensive)', async () => {
    const { useCase, webauthn, passkeys } = buildUseCase();
    webauthn.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
    });

    await expect(
      useCase.execute({ userId: 'user-1', response: RESPONSE_STUB }),
    ).rejects.toBeInstanceOf(PasskeyEnrollmentFailedError);
    expect(passkeys.create).not.toHaveBeenCalled();
  });
});
