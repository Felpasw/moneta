import api from "@/api";

import type {
  IAuthService,
  LoginCredentials,
  LoginResponse,
  RefreshResponse,
  SignupData,
  SignupResponse,
} from "./interfaces/auth.interface";

class AuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);

    return data;
  }

  async signup(payload: SignupData): Promise<SignupResponse> {
    const { data } = await api.post<SignupResponse>("/auth/signup", payload);

    return data;
  }

  async logout(): Promise<void> {
    await api.post("/auth/logout", {});
  }

  async refresh(): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>("/auth/refresh", {});

    return data;
  }
}

const authService = new AuthService();

export default authService;
