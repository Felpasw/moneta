import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  usePathname: () => "/dashboard",
}));

const logoutMutate = vi.fn(
  (_arg: unknown, options: { onSettled?: () => void } = {}) => {
    options.onSettled?.();
  },
);
const refreshMutateAsync = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  default: {
    use: () => ({
      logout: { mutate: logoutMutate },
      refresh: { mutateAsync: refreshMutateAsync },
    }),
  },
}));

import { AppShell } from "@/components/templates/AppShell";
import { useUserStore } from "@/stores/userStore";

const wrap = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const STORED_USER = {
  id: "u-1",
  email: "felipe@moneta.com",
  name: "Felipe",
  onboardedAt: null,
};

describe("<AppShell />", () => {
  beforeEach(() => {
    routerPush.mockClear();
    logoutMutate.mockClear();
    refreshMutateAsync.mockReset();
    useUserStore.setState({ user: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ user: null });
  });

  it("bloqueia children até o refresh completar e mostra loader", async () => {
    useUserStore.setState({ user: STORED_USER });
    let resolveRefresh!: (v: { user: typeof STORED_USER }) => void;
    refreshMutateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve as typeof resolveRefresh;
      }),
    );

    const Wrapper = wrap();
    render(
      <Wrapper>
        <AppShell>
          <div>conteúdo protegido</div>
        </AppShell>
      </Wrapper>,
    );

    expect(
      screen.getByRole("status", { name: /preparando sua sessão/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("conteúdo protegido")).toBeNull();

    await act(async () => {
      resolveRefresh({ user: STORED_USER });
    });

    await waitFor(() => {
      expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
    });
  });

  it("empurra /login quando não há user no store", async () => {
    const Wrapper = wrap();
    render(
      <Wrapper>
        <AppShell>
          <div>protegido</div>
        </AppShell>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/login");
    });
    expect(refreshMutateAsync).not.toHaveBeenCalled();
  });

  it("empurra /login quando refresh falha", async () => {
    useUserStore.setState({ user: STORED_USER });
    refreshMutateAsync.mockRejectedValue(new Error("401"));

    const Wrapper = wrap();
    render(
      <Wrapper>
        <AppShell>
          <div>protegido</div>
        </AppShell>
      </Wrapper>,
    );

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/login");
    });
  });

  it("monta a AppSidebar como landmark 'User Profile Menu'", async () => {
    useUserStore.setState({ user: STORED_USER });
    refreshMutateAsync.mockResolvedValue({ user: STORED_USER });

    const Wrapper = wrap();
    render(
      <Wrapper>
        <AppShell>
          <div>child</div>
        </AppShell>
      </Wrapper>,
    );

    expect(
      screen.getByRole("complementary", { name: /user profile menu/i }),
    ).toBeInTheDocument();
  });

  it("lista todas as rotas incluindo o item Assistente", async () => {
    useUserStore.setState({ user: STORED_USER });
    refreshMutateAsync.mockResolvedValue({ user: STORED_USER });

    const Wrapper = wrap();
    render(
      <Wrapper>
        <AppShell>
          <div>child</div>
        </AppShell>
      </Wrapper>,
    );

    const items: Array<[string, string]> = [
      ["Início", "/dashboard"],
      ["Transações", "/transactions"],
      ["Cartões", "/cards"],
      ["Contas", "/accounts"],
      ["Categorias", "/categories"],
      ["Configurações", "/settings"],
      ["Assistente", "/settings/assistant"],
    ];
    for (const [label, href] of items) {
      const link = screen.getByRole("link", { name: new RegExp(label, "i") });
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("botão Sair chama logout e redireciona pra /login", async () => {
    useUserStore.setState({ user: STORED_USER });
    refreshMutateAsync.mockResolvedValue({ user: STORED_USER });

    const Wrapper = wrap();
    render(
      <Wrapper>
        <AppShell>
          <div>child</div>
        </AppShell>
      </Wrapper>,
    );

    await userEvent.click(screen.getByRole("button", { name: /sair/i }));

    expect(logoutMutate).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith("/login");
  });
});
