import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import authHooks from "@/hooks/useAuth";
import authService from "@/services/auth.service";
import { useUserStore, type AuthUser } from "@/stores/userStore";

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
    useUserStore.setState({ user: null });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useUserStore.setState({ user: null });
  });

  describe("login", () => {
    it("salva user no store no sucesso (tokens vêm via cookie httpOnly)", async () => {
      mockedAuth.login.mockResolvedValueOnce({ user: USER });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.login.mutateAsync({
          email: "a@b.com",
          password: "hunter22",
        });
      });

      expect(useUserStore.getState().user).toEqual(USER);
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

      expect(useUserStore.getState().user).toBeNull();
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
      expect(useUserStore.getState().user).toBeNull();
    });
  });

  describe("logout", () => {
    it("chama service e limpa store no sucesso", async () => {
      useUserStore.setState({ user: USER });
      mockedAuth.logout.mockResolvedValueOnce();

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.logout.mutateAsync();
      });

      expect(useUserStore.getState().user).toBeNull();
    });
  });

  describe("refresh", () => {
    it("salva user no store no sucesso", async () => {
      mockedAuth.refresh.mockResolvedValueOnce({ user: USER });

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.refresh.mutateAsync();
      });

      expect(useUserStore.getState().user).toEqual(USER);
    });

    it("limpa user quando refresh falha", async () => {
      useUserStore.setState({ user: USER });
      mockedAuth.refresh.mockRejectedValueOnce(new Error("401"));

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => authHooks.use(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.refresh
          .mutateAsync()
          .catch(() => undefined);
      });

      expect(useUserStore.getState().user).toBeNull();
    });
  });
});
