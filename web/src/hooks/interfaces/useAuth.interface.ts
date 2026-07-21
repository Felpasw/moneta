import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type {
  LoginCredentials,
  LoginResponse,
  SignupData,
  SignupResponse,
} from "@/services/interfaces/auth.interface";
import type { AuthUser } from "@/utils/userManager";

export interface AuthHooksResult {
  profile: UseQueryResult<AuthUser | null>;
  login: UseMutationResult<LoginResponse, unknown, LoginCredentials>;
  signup: UseMutationResult<SignupResponse, unknown, SignupData>;
  logout: UseMutationResult<void, unknown, void>;
}

export interface IAuthHooks {
  use(): AuthHooksResult;
}
