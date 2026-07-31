import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import authHooks, { AUTH_QUERY_KEYS } from "@/hooks/useAuth";
import authService from "@/services/auth.service";
import userManager, { type AuthUser } from "@/utils/userManager";

vi.mock("@/services/auth.service", () => ({
  default: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(authService);

const USER: AuthUser = {
  id: "u1",
  email: "a@b.com",
  name: "Alice",
  onboardedAt: null,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, Wrapper };
};

describe("authHooks.use()", () => {
  beforeEach(() => {
    userManager.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    userManager.clear();
  });

  describe("login", () => {
    it("salva user no userManager e popula cache no sucesso (tokens vêm via cookie httpOnly)", async () => {
      mockedAuth.login.mockResolvedValueOnce({ user: USER });

      const { queryClient, Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.login.mutateAsync({
          email: "a@b.com",
          password: "hunter22",
        });
      });

      expect(userManager.getUser()).toEqual(USER);
      expect(queryClient.getQueryData(AUTH_QUERY_KEYS.profile)).toEqual(USER);
    });

    it("não persiste user quando login falha", async () => {
      mockedAuth.login.mockRejectedValueOnce(new Error("bad creds"));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.login
          .mutateAsync({ email: "x@y.com", password: "wrong" })
          .catch(() => undefined);
      });

      expect(userManager.getUser()).toBeNull();
    });
  });

  describe("signup", () => {
    it("apenas cadastra e não seta user (backend não autentica no signup)", async () => {
      mockedAuth.signup.mockResolvedValueOnce({ user: USER });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.signup.mutateAsync({
          email: "a@b.com",
          password: "hunter22",
          name: "Alice",
        });
      });

      expect(mockedAuth.signup).toHaveBeenCalledOnce();
      expect(userManager.getUser()).toBeNull();
    });
  });

  describe("logout", () => {
    it("chama service e limpa userManager + cache no sucesso", async () => {
      userManager.setUser(USER);
      mockedAuth.logout.mockResolvedValueOnce();

      const { queryClient, Wrapper } = createWrapper();
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, USER);

      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.logout.mutateAsync();
      });

      expect(userManager.getUser()).toBeNull();
      expect(queryClient.getQueryData(AUTH_QUERY_KEYS.profile)).toBeFalsy();
    });
  });

  describe("profile", () => {
    it("retorna user cacheado do userManager sem hit no service", async () => {
      userManager.setUser(USER);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.profile.data).toEqual(USER);
      });

      expect(mockedAuth.login).not.toHaveBeenCalled();
      expect(mockedAuth.signup).not.toHaveBeenCalled();
    });
  });
});
