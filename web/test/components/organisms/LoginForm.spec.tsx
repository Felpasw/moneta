import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/organisms/LoginForm";

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

function renderWithProviders(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>);
}

describe("<LoginForm />", () => {
  beforeEach(() => {
    loginMutateAsync.mockReset();
    routerPush.mockReset();
  });

  it("renderiza campos de email e senha e botão de submit", () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(/e-?mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("bloqueia submit e mostra erros quando campos vazios", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    expect(loginMutateAsync).not.toHaveBeenCalled();
  });

  it("chama login.mutateAsync com credenciais quando o form é válido", async () => {
    loginMutateAsync.mockResolvedValueOnce({ user: { id: "u1" }, accessToken: "t" });
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/e-?mail/i), "prima@gostosa.com");
    await user.type(screen.getByLabelText(/^senha$/i), "hunter22!");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(loginMutateAsync).toHaveBeenCalledTimes(1);
    expect(loginMutateAsync).toHaveBeenCalledWith({
      email: "prima@gostosa.com",
      password: "hunter22!",
    });
  });
});
