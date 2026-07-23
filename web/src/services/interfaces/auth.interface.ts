import type { AuthUser } from "@/utils/userManager";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface SignupResponse {
  user: AuthUser;
}

export type RefreshResponse = LoginResponse;

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<LoginResponse>;
  signup(data: SignupData): Promise<SignupResponse>;
  logout(): Promise<void>;
  refresh(): Promise<RefreshResponse>;
}
