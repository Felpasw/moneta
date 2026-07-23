import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLoginForm } from "@/hooks/useLoginForm";

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
      signup: { mutateAsync: vi.fn(), isPending: false },
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

describe("useLoginForm()", () => {
  beforeEach(() => {
    loginMutateAsync.mockReset();
    routerPush.mockReset();
  });

  it("expõe control, handleSubmit, isPending e status", () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    expect(result.current.control).toBeDefined();
    expect(typeof result.current.onSubmit).toBe("function");
    expect(result.current.isPending).toBe(false);
    expect(result.current.status).toBe("idle");
  });

  it("redireciona pra / quando user.onboardedAt já veio preenchido", async () => {
    loginMutateAsync.mockResolvedValueOnce({
      user: { id: "u1", onboardedAt: "2026-01-01T00:00:00.000Z" },
      accessToken: "t",
    });
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    result.current.setValue("email", "prima@moneta.com");
    result.current.setValue("password", "hunter22!");

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(loginMutateAsync).toHaveBeenCalledWith({
      email: "prima@moneta.com",
      password: "hunter22!",
    });
    expect(routerPush).toHaveBeenCalledWith("/");
  });

  it("redireciona pra /onboarding quando user.onboardedAt é null", async () => {
    loginMutateAsync.mockResolvedValueOnce({
      user: { id: "u1", onboardedAt: null },
      accessToken: "t",
    });
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    result.current.setValue("email", "prima@moneta.com");
    result.current.setValue("password", "hunter22!");

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(routerPush).toHaveBeenCalledWith("/onboarding");
    expect(routerPush).not.toHaveBeenCalledWith("/");
  });

  it("não chama mutateAsync quando validação falha", async () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(loginMutateAsync).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
