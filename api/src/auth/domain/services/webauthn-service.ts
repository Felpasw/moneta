export const WEBAUTHN_SERVICE = Symbol('WEBAUTHN_SERVICE');

export interface GenerateRegistrationOptionsInput {
  rpID: string;
  rpName: string;
  userID: Uint8Array;
  userName: string;
  userDisplayName: string;
  excludeCredentials: Array<{
    id: string;
    transports?: string[];
  }>;
}

export interface RegistrationOptions {
  challenge: string;
  [key: string]: unknown;
}

export interface VerifyRegistrationInput {
  response: unknown;
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRPID: string;
}

export interface VerifiedRegistrationCredential {
  credentialId: string;
  publicKey: Uint8Array;
  counter: number;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
}

export interface VerifiedRegistration {
  verified: boolean;
  credential?: VerifiedRegistrationCredential;
}

export interface WebAuthnService {
  generateRegistrationOptions(
    input: GenerateRegistrationOptionsInput,
  ): Promise<RegistrationOptions>;
  verifyRegistrationResponse(
    input: VerifyRegistrationInput,
  ): Promise<VerifiedRegistration>;
}
