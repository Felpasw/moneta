export const PASSKEY_CREDENTIALS_REPOSITORY = Symbol(
  'PASSKEY_CREDENTIALS_REPOSITORY',
);

export interface PasskeyCredentialSummary {
  credentialId: string;
  transports: string[];
}

export interface PasskeyCredentialsRepository {
  findByUserId(userId: string): Promise<PasskeyCredentialSummary[]>;
}
