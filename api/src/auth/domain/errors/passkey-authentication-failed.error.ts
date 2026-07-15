export enum PasskeyAuthenticationFailedReason {
  CHALLENGE_NOT_FOUND = 'challenge_not_found',
  CREDENTIAL_NOT_FOUND = 'credential_not_found',
  VERIFICATION_FAILED = 'verification_failed',
}

export class PasskeyAuthenticationFailedError extends Error {
  constructor(public readonly reason: PasskeyAuthenticationFailedReason) {
    super(`Passkey authentication failed: ${reason}`);
    this.name = 'PasskeyAuthenticationFailedError';
  }
}
