import type {
  AuthenticationOptions,
  RegistrationOptions,
} from '../../domain/services/webauthn-service';

export interface EnrollPasskeyBeginInput {
  userId: string;
}

export type EnrollPasskeyBeginResult = RegistrationOptions;

export interface EnrollPasskeyFinishInput {
  userId: string;
  response: unknown;
}

export interface AuthPasskeyBeginInput {
  email?: string;
}

export interface AuthPasskeyBeginResult {
  sessionId: string;
  options: AuthenticationOptions;
}

export interface AuthPasskeyFinishInput {
  sessionId: string;
  response: { id: string; [key: string]: unknown };
  userAgent?: string;
  ip?: string;
}
