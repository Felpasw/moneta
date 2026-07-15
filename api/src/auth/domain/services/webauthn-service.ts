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

export interface WebAuthnService {
  generateRegistrationOptions(
    input: GenerateRegistrationOptionsInput,
  ): Promise<RegistrationOptions>;
}
