export enum InvalidRefreshTokenReason {
  INVALID_SIGNATURE = 'invalid_signature',
  SESSION_NOT_FOUND = 'session_not_found',
  USER_MISMATCH = 'user_mismatch',
  SESSION_REVOKED = 'session_revoked',
  SESSION_EXPIRED = 'session_expired',
}

export class InvalidRefreshTokenError extends Error {
  constructor(public readonly reason: InvalidRefreshTokenReason) {
    super(`Invalid refresh token: ${reason}`);
    this.name = 'InvalidRefreshTokenError';
  }
}
