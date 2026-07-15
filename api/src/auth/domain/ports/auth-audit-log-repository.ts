export const AUTH_AUDIT_LOG_REPOSITORY = Symbol('AUTH_AUDIT_LOG_REPOSITORY');

export enum AuthAuditEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PASSKEY_ENROLLED = 'passkey_enrolled',
  OAUTH_LINKED = 'oauth_linked',
  PASSWORD_CHANGED = 'password_changed',
  ALL_SESSIONS_REVOKED = 'all_sessions_revoked',
}

export interface RecordAuditEventInput {
  event: AuthAuditEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  context?: Record<string, unknown>;
}

export interface AuthAuditLogRepository {
  record(input: RecordAuditEventInput): Promise<void>;
}
