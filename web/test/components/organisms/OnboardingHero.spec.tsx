import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingHero } from "@/components/organisms/OnboardingHero";
import { AgentSessionStatus } from "@/hooks/useAgentSession";

vi.mock("@/components/atoms/VoiceOrb", () => ({
  VoiceOrb: () => <div data-testid="voice-orb" />,
}));

const useAgentSessionMock = vi.fn<
  (opts: { enabled: boolean }) => {
    status: AgentSessionStatus;
    error: string | null;
    audioElement: HTMLAudioElement | null;
    isWarming: boolean;
  }
>(() => ({
  status: AgentSessionStatus.Idle,
  error: null,
  audioElement: null,
  isWarming: false,
}));

vi.mock("@/hooks/useAgentSession", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/useAgentSession")
  >("@/hooks/useAgentSession");
  return {
    ...actual,
    useAgentSession: (opts: { enabled: boolean }) => useAgentSessionMock(opts),
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

  it("abre a sessão do agente ao montar", () => {
    useAgentSessionMock.mockClear();
    render(<OnboardingHero />);

    expect(useAgentSessionMock).toHaveBeenCalledWith({ enabled: true });
  });

  it("mostra BarLoader enquanto isWarming=true", () => {
    useAgentSessionMock.mockReturnValueOnce({
      status: AgentSessionStatus.Connecting,
      error: null,
      audioElement: null,
      isWarming: true,
    });
    render(<OnboardingHero />);

    expect(screen.getByRole("status", { name: /conectando/i })).toBeInTheDocument();
  });

  it("esconde BarLoader quando isWarming=false", () => {
    useAgentSessionMock.mockReturnValueOnce({
      status: AgentSessionStatus.Speaking,
      error: null,
      audioElement: null,
      isWarming: false,
    });
    render(<OnboardingHero />);

    expect(screen.queryByRole("status", { name: /conectando/i })).toBeNull();
  });
});
