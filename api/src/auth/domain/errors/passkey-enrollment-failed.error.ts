export enum PasskeyEnrollmentFailedReason {
  CHALLENGE_NOT_FOUND = 'challenge_not_found',
  VERIFICATION_FAILED = 'verification_failed',
}

export class PasskeyEnrollmentFailedError extends Error {
  constructor(public readonly reason: PasskeyEnrollmentFailedReason) {
    super(`Passkey enrollment failed: ${reason}`);
    this.name = 'PasskeyEnrollmentFailedError';
  }
}
