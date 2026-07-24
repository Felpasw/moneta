import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingScreen } from "@/components/templates/OnboardingScreen";
import {
  AgentSessionStatus,
  MicState,
} from "@/hooks/useAgentSession";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";

vi.mock("@/components/atoms/VoiceOrb", () => ({
  VoiceOrb: () => <div data-testid="voice-orb" />,
}));

vi.mock("@/components/atoms/BankIcon", () => ({
  BankIcon: ({ bankName }: { bankName: string }) => (
    <span data-testid="bank-icon" data-bank={bankName} />
  ),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: vi.fn() },
}));

const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
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
  routerPush.mockClear();
});

describe("<OnboardingScreen />", () => {
  it("abre a sessão do agente com mic desligado por default", () => {
    render(<OnboardingScreen />);
    expect(useAgentSessionMock).toHaveBeenCalledWith({
      enabled: true,
      micEnabled: false,
    });
  });

  it("clicar em MicButton pede pra re-renderizar com micEnabled=true", async () => {
    const user = userEvent.setup();
    render(<OnboardingScreen />);

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
    render(<OnboardingScreen />);

    await new Promise((r) => setTimeout(r, 0));
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/permita o microfone/i),
    );
  });

  it("renderiza o StepIndicator com os labels do onboarding", () => {
    render(<OnboardingScreen />);
    for (const label of ["Apelido", "Bancos", "Saldos", "Ajustes", "Pronto"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
