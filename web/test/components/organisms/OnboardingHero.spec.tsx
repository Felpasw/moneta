import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OnboardingHero } from "@/components/organisms/OnboardingHero";
import {
  AgentSessionStatus,
  MicState,
} from "@/hooks/useAgentSession";

vi.mock("@/components/atoms/VoiceOrb", () => ({
  VoiceOrb: () => <div data-testid="voice-orb" />,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

interface AgentSessionShape {
  status: AgentSessionStatus;
  error: string | null;
  audioElement: HTMLAudioElement | null;
  isWarming: boolean;
  micStream: MediaStream | null;
  micState: MicState;
}

const useAgentSessionMock = vi.fn<
  (opts: { enabled: boolean; micEnabled?: boolean }) => AgentSessionShape
>(() => ({
  status: AgentSessionStatus.Idle,
  error: null,
  audioElement: null,
  isWarming: false,
  micStream: null,
  micState: MicState.Off,
}));

vi.mock("@/hooks/useAgentSession", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/useAgentSession")
  >("@/hooks/useAgentSession");
  return {
    ...actual,
    useAgentSession: (opts: { enabled: boolean; micEnabled?: boolean }) =>
      useAgentSessionMock(opts),
  };
});

describe("<OnboardingHero />", () => {
  it("renderiza orb, título e subtítulo", () => {
    render(<OnboardingHero />);

    expect(screen.getByTestId("voice-orb")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /bem-vindo à moneta/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/toma um segundo pro seu assistente respirar/i),
    ).toBeInTheDocument();
  });

  it("abre a sessão do agente ao montar com mic desligado", () => {
    useAgentSessionMock.mockClear();
    render(<OnboardingHero />);

    expect(useAgentSessionMock).toHaveBeenCalledWith({
      enabled: true,
      micEnabled: false,
    });
  });

  it("mostra BarLoader enquanto isWarming=true", () => {
    useAgentSessionMock.mockReturnValueOnce({
      status: AgentSessionStatus.Connecting,
      error: null,
      audioElement: null,
      isWarming: true,
      micStream: null,
      micState: MicState.Off,
    });
    render(<OnboardingHero />);

    expect(screen.getByRole("status", { name: /conectando/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ligar mic/i })).toBeNull();
  });

  it("mostra MicButton quando isWarming=false", () => {
    useAgentSessionMock.mockReturnValueOnce({
      status: AgentSessionStatus.Speaking,
      error: null,
      audioElement: null,
      isWarming: false,
      micStream: null,
      micState: MicState.Off,
    });
    render(<OnboardingHero />);

    expect(screen.getByRole("button", { name: /ligar mic/i })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /conectando/i })).toBeNull();
  });

  it("clicar em MicButton flipa micEnabled na próxima chamada do hook", async () => {
    useAgentSessionMock.mockClear();
    useAgentSessionMock.mockImplementation(() => ({
      status: AgentSessionStatus.Listening,
      error: null,
      audioElement: null,
      isWarming: false,
      micStream: null,
      micState: MicState.Off,
    }));
    const user = userEvent.setup();
    render(<OnboardingHero />);

    await user.click(screen.getByRole("button", { name: /ligar mic/i }));

    const lastCall =
      useAgentSessionMock.mock.calls[useAgentSessionMock.mock.calls.length - 1];
    expect(lastCall[0]).toEqual({ enabled: true, micEnabled: true });
  });
});
