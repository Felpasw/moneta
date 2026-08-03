/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `authHooks.use()` acontece durante o
 * render em ordem estável, então Rules of Hooks (runtime) segue respeitada.
 * Regra: `use()` chama todos os hooks no topo em ordem fixa, sem `if`/loop.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import authService from "@/services/auth.service";
import type {
  LoginCredentials,
  LoginResponse,
  SignupData,
  SignupResponse,
} from "@/services/interfaces/auth.interface";
import { userStoreActions } from "@/stores/userStore";

import type {
  AuthHooksResult,
  IAuthHooks,
} from "./interfaces/useAuth.interface";

export const AUTH_QUERY_KEYS = {
  all: ["auth"] as const,
};

class AuthHooks implements IAuthHooks {
  use(): AuthHooksResult {
    const queryClient = useQueryClient();

    const login = useMutation<LoginResponse, unknown, LoginCredentials>({
      mutationFn: (credentials) => authService.login(credentials),
      onSuccess: (data) => userStoreActions.setUser(data.user),
    });

    const signup = useMutation<SignupResponse, unknown, SignupData>({
      mutationFn: (payload) => authService.signup(payload),
    });

    const logout = useMutation<void, unknown, void>({
      mutationFn: () => authService.logout(),
      onSuccess: () => {
        userStoreActions.clear();
        queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.all });
      },
    });

    const refresh = useMutation<LoginResponse, unknown, void>({
      mutationFn: () => authService.refresh(),
      onSuccess: (data) => userStoreActions.setUser(data.user),
      onError: () => userStoreActions.clear(),
    });

    return { login, signup, logout, refresh };
  }
}

const authHooks = new AuthHooks();

export default authHooks;
