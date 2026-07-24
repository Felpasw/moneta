import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardScreen } from "@/components/templates/DashboardScreen";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";
import { AgentSessionStatus, MicState } from "@/hooks/useAgentSession";

vi.mock("@/components/atoms/VoiceOrb", () => ({
  VoiceOrb: () => <div data-testid="voice-orb" />,
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: vi.fn(),
  },
}));

interface AgentSessionShape {
  status: AgentSessionStatus;
  error: string | null;
  audioElement: HTMLAudioElement | null;
  isWarming: boolean;
  micStream: MediaStream | null;
  micState: MicState;
  toolEvents: ToolEvent[];
}

const useAgentSessionMock = vi.fn<
  (opts: { enabled: boolean; micEnabled?: boolean }) => AgentSessionShape
>(() => ({
  status: AgentSessionStatus.Listening,
  error: null,
  audioElement: null,
  isWarming: false,
  micStream: null,
  micState: MicState.Off,
  toolEvents: [],
}));

vi.mock("@/hooks/useAgentSession", async () => {
  const actual =
    await vi.importActual<typeof import("@/hooks/useAgentSession")>(
      "@/hooks/useAgentSession",
    );
  return {
    ...actual,
    useAgentSession: (opts: { enabled: boolean; micEnabled?: boolean }) =>
      useAgentSessionMock(opts),
  };
});

afterEach(() => {
  useAgentSessionMock.mockClear();
  toastError.mockClear();
});

describe("<DashboardScreen />", () => {
  it("abre a sessão do agente com mic desligado por default", () => {
    render(<DashboardScreen />);
    expect(useAgentSessionMock).toHaveBeenCalledWith({
      enabled: true,
      micEnabled: false,
    });
  });

  it("renderiza o voice orb centralizado + mic button", () => {
    render(<DashboardScreen />);
    expect(screen.getByTestId("voice-orb")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ligar mic/i }),
    ).toBeInTheDocument();
  });

  it("clicar no MicButton re-renderiza com micEnabled=true", async () => {
    const user = userEvent.setup();
    render(<DashboardScreen />);

    await user.click(screen.getByRole("button", { name: /ligar mic/i }));

    const lastCall =
      useAgentSessionMock.mock.calls[useAgentSessionMock.mock.calls.length - 1];
    expect(lastCall[0]).toEqual({ enabled: true, micEnabled: true });
  });

  it("dispara toast e reseta mic quando micState=denied", async () => {
    useAgentSessionMock.mockReturnValue({
      status: AgentSessionStatus.Listening,
      error: null,
      audioElement: null,
      isWarming: false,
      micStream: null,
      micState: MicState.Denied,
      toolEvents: [],
    });
    render(<DashboardScreen />);

    await new Promise((r) => setTimeout(r, 0));
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/permita o microfone/i),
    );
  });

  it("mostra BarLoader enquanto isWarming=true (sem MicButton)", () => {
    useAgentSessionMock.mockReturnValue({
      status: AgentSessionStatus.Listening,
      error: null,
      audioElement: null,
      isWarming: true,
      micStream: null,
      micState: MicState.Off,
      toolEvents: [],
    });
    render(<DashboardScreen />);

    expect(
      screen.getByRole("status", { name: /conectando/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ligar mic/i })).toBeNull();
  });

  it("NÃO renderiza StepIndicator do onboarding (modo livre)", () => {
    render(<DashboardScreen />);
    for (const label of ["Apelido", "Bancos", "Saldos", "Ajustes", "Pronto"]) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it("monta a AppSidebar como landmark 'User Profile Menu'", () => {
    render(<DashboardScreen />);
    expect(
      screen.getByRole("complementary", { name: /user profile menu/i }),
    ).toBeInTheDocument();
  });

  it("lista as ações do usuário no Moneta (Início, Transações, Cartões, Contas, Categorias, Configurações)", () => {
    render(<DashboardScreen />);
    const items: Array<[string, string]> = [
      ["Início", "/dashboard"],
      ["Transações", "/transactions"],
      ["Cartões", "/cards"],
      ["Contas", "/accounts"],
      ["Categorias", "/categories"],
      ["Configurações", "/settings"],
    ];
    for (const [label, href] of items) {
      const link = screen.getByRole("link", { name: new RegExp(label, "i") });
      expect(link).toHaveAttribute("href", href);
    }
  });
});
