import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSignupForm } from "@/hooks/useSignupForm";

const signupMutateAsync = vi.fn();
const loginMutateAsync = vi.fn();
const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  AUTH_QUERY_KEYS: { all: ["auth"], profile: ["auth", "profile"] },
  default: {
    use: () => ({
      login: { mutateAsync: loginMutateAsync, isPending: false },
      signup: { mutateAsync: signupMutateAsync, isPending: false },
      logout: { mutateAsync: vi.fn(), isPending: false },
      profile: { data: null },
    }),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSignupForm()", () => {
  beforeEach(() => {
    signupMutateAsync.mockReset();
    loginMutateAsync.mockReset();
    routerPush.mockReset();
  });

  it("expõe control, onSubmit e status", () => {
    const { result } = renderHook(() => useSignupForm(), { wrapper });

    expect(result.current.control).toBeDefined();
    expect(typeof result.current.onSubmit).toBe("function");
    expect(result.current.status).toBe("idle");
  });

  it("com dados válidos: signup + login automático + push /", async () => {
    signupMutateAsync.mockResolvedValueOnce({ user: { id: "u1" } });
    loginMutateAsync.mockResolvedValueOnce({
      user: { id: "u1" },
      accessToken: "t",
    });
    const { result } = renderHook(() => useSignupForm(), { wrapper });

    result.current.setValue("name", "Felipe");
    result.current.setValue("email", "prima@moneta.com");
    result.current.setValue("password", "hunter22!");

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(signupMutateAsync).toHaveBeenCalledWith({
      name: "Felipe",
      email: "prima@moneta.com",
      password: "hunter22!",
    });
    expect(loginMutateAsync).toHaveBeenCalledWith({
      email: "prima@moneta.com",
      password: "hunter22!",
    });
    expect(routerPush).toHaveBeenCalledWith("/");
  });

  it("não chama mutation quando validação falha", async () => {
    const { result } = renderHook(() => useSignupForm(), { wrapper });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(signupMutateAsync).not.toHaveBeenCalled();
    expect(loginMutateAsync).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
