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

export interface SessionsRepository {
  create(input: CreateSessionInput): Promise<Session>;
}
