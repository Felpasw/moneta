import type { UseMutationResult } from "@tanstack/react-query";

import type {
  LoginCredentials,
  LoginResponse,
  SignupData,
  SignupResponse,
} from "@/services/interfaces/auth.interface";

export interface AuthHooksResult {
  login: UseMutationResult<LoginResponse, unknown, LoginCredentials>;
  signup: UseMutationResult<SignupResponse, unknown, SignupData>;
  logout: UseMutationResult<void, unknown, void>;
  refresh: UseMutationResult<LoginResponse, unknown, void>;
}

export interface IAuthHooks {
  use(): AuthHooksResult;
}
