/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `authHooks.use()` acontece durante o
 * render em ordem estável, então Rules of Hooks (runtime) segue respeitada.
 * Regra: `use()` chama todos os hooks no topo em ordem fixa, sem `if`/loop.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import authService from "@/services/auth.service";
import type {
  LoginCredentials,
  LoginResponse,
  SignupData,
  SignupResponse,
} from "@/services/interfaces/auth.interface";
import userManager, { type AuthUser } from "@/utils/userManager";

import type { AuthHooksResult, IAuthHooks } from "./interfaces/useAuth.interface";

export const AUTH_QUERY_KEYS = {
  all: ["auth"] as const,
  profile: ["auth", "profile"] as const,
};

class AuthHooks implements IAuthHooks {
  use(): AuthHooksResult {
    const queryClient = useQueryClient();

    const profile = useQuery<AuthUser | null>({
      queryKey: AUTH_QUERY_KEYS.profile,
      queryFn: () => userManager.getUser(),
      staleTime: Infinity,
      gcTime: Infinity,
    });

    const login = useMutation<LoginResponse, unknown, LoginCredentials>({
      mutationFn: (credentials) => authService.login(credentials),
      onSuccess: (data) => {
        userManager.setUser(data.user);
        userManager.setAccessToken(data.accessToken);
        queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data.user);
      },
    });

    const signup = useMutation<SignupResponse, unknown, SignupData>({
      mutationFn: (payload) => authService.signup(payload),
    });

    const logout = useMutation<void, unknown, void>({
      mutationFn: () => authService.logout(),
      onSuccess: () => {
        userManager.clear();
        queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.all });
      },
    });

    return { profile, login, signup, logout };
  }
}

const authHooks = new AuthHooks();

export default authHooks;
