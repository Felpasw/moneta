import type { UserSnapshot } from '../../../users/domain/ports/users-repository';

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

export interface PasskeyCredentialWithUser {
  credentialId: string;
  userId: string;
  publicKey: Uint8Array;
  counter: number;
  transports: string[];
  user: UserSnapshot;
}

export interface PasskeyCredentialsRepository {
  findByUserId(userId: string): Promise<PasskeyCredentialSummary[]>;
  create(input: CreatePasskeyCredentialInput): Promise<void>;
  findByCredentialId(
    credentialId: string,
  ): Promise<PasskeyCredentialWithUser | null>;
  updateCounter(
    credentialId: string,
    counter: number,
    lastUsedAt: Date,
  ): Promise<void>;
}
