export const PASSKEY_CREDENTIALS_REPOSITORY = Symbol(
  'PASSKEY_CREDENTIALS_REPOSITORY',
);

export interface PasskeyCredentialSummary {
  credentialId: string;
  transports: string[];
}

export interface CreatePasskeyCredentialInput {
  userId: string;
  credentialId: string;
  publicKey: Uint8Array;
  counter: number;
  transports: string[];
  deviceType?: string;
  backedUp?: boolean;
}

export interface PasskeyCredentialsRepository {
  findByUserId(userId: string): Promise<PasskeyCredentialSummary[]>;
  create(input: CreatePasskeyCredentialInput): Promise<void>;
}
