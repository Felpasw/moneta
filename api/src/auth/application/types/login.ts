import type { UserSnapshot } from '../../../users/domain/ports/users-repository';

export interface LoginWithPasswordInput {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
}

export interface LoginResult {
  user: UserSnapshot;
  accessToken: string;
  refreshToken: string;
}
