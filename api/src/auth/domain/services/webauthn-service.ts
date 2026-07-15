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

export interface GenerateAuthenticationOptionsInput {
  rpID: string;
  allowCredentials: Array<{
    id: string;
    transports?: string[];
  }>;
}

export interface AuthenticationOptions {
  challenge: string;
  [key: string]: unknown;
}

export interface VerifyAuthenticationInput {
  response: unknown;
  expectedChallenge: string;
  expectedOrigin: string;
  expectedRPID: string;
  credential: {
    id: string;
    publicKey: Uint8Array;
    counter: number;
    transports?: string[];
  };
}

export interface VerifiedAuthentication {
  verified: boolean;
  newCounter?: number;
}

export interface WebAuthnService {
  generateRegistrationOptions(
    input: GenerateRegistrationOptionsInput,
  ): Promise<RegistrationOptions>;
  verifyRegistrationResponse(
    input: VerifyRegistrationInput,
  ): Promise<VerifiedRegistration>;
  generateAuthenticationOptions(
    input: GenerateAuthenticationOptionsInput,
  ): Promise<AuthenticationOptions>;
  verifyAuthenticationResponse(
    input: VerifyAuthenticationInput,
  ): Promise<VerifiedAuthentication>;
}
