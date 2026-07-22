import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignupForm } from "@/components/organisms/SignupForm";

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

function renderWithProviders(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>);
}

describe("<SignupForm />", () => {
  beforeEach(() => {
    signupMutateAsync.mockReset();
    loginMutateAsync.mockReset();
    routerPush.mockReset();
  });

  it("renderiza nome, email, senha e botão cadastrar", () => {
    renderWithProviders(<SignupForm />);

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-?mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cadastrar/i })).toBeInTheDocument();
  });

  it("bloqueia submit quando campos vazios", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    expect(signupMutateAsync).not.toHaveBeenCalled();
  });

  it("com form válido: dispara signup + login com as mesmas credenciais", async () => {
    signupMutateAsync.mockResolvedValueOnce({ user: { id: "u1" } });
    loginMutateAsync.mockResolvedValueOnce({
      user: { id: "u1" },
      accessToken: "t",
    });
    const user = userEvent.setup();
    renderWithProviders(<SignupForm />);

    await user.type(screen.getByLabelText(/nome/i), "Felipe");
    await user.type(screen.getByLabelText(/e-?mail/i), "prima@moneta.com");
    await user.type(screen.getByLabelText(/^senha$/i), "hunter22!");
    await user.click(screen.getByRole("button", { name: /cadastrar/i }));

    expect(signupMutateAsync).toHaveBeenCalledWith({
      name: "Felipe",
      email: "prima@moneta.com",
      password: "hunter22!",
    });
    expect(loginMutateAsync).toHaveBeenCalledWith({
      email: "prima@moneta.com",
      password: "hunter22!",
    });
  });
});
