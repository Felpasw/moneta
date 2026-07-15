import type { UserSnapshot } from '../../../users/domain/ports/users-repository';

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionWithUser {
  id: string;
  userId: string;
  revokedAt: Date | null;
  expiresAt: Date;
  user: UserSnapshot;
}

export interface RotateSessionInput {
  previousSessionId: string;
  next: CreateSessionInput;
  now: Date;
}

export interface SessionsRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findByRefreshTokenHash(hash: string): Promise<SessionWithUser | null>;
  rotate(input: RotateSessionInput): Promise<Session>;
}
