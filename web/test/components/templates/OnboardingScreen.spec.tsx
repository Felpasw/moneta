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
  redirectTarget: string | null;
}

const defaultAgentSessionShape = (): AgentSessionShape => ({
  status: AgentSessionStatus.Listening,
  error: null,
  audioElement: null,
  isWarming: false,
  micStream: null,
  micState: MicState.Off,
  toolEvents: [],
  redirectTarget: null,
});

const useAgentSessionMock = vi.fn<
  (opts: { enabled: boolean; micEnabled?: boolean }) => AgentSessionShape
>(defaultAgentSessionShape);

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
  useAgentSessionMock.mockReset();
  useAgentSessionMock.mockImplementation(defaultAgentSessionShape);
  toastError.mockClear();
  routerPush.mockClear();
});

describe("<OnboardingScreen />", () => {
  it("opens the agent session with the mic off by default", () => {
    render(<OnboardingScreen />);
    expect(useAgentSessionMock).toHaveBeenCalledWith({
      enabled: true,
      micEnabled: false,
    });
  });

  it("clicking MicButton asks for a re-render with micEnabled=true", async () => {
    const user = userEvent.setup();
    render(<OnboardingScreen />);

    await user.click(screen.getByRole("button", { name: /turn on mic/i }));

    const lastCall =
      useAgentSessionMock.mock.calls[useAgentSessionMock.mock.calls.length - 1];
    expect(lastCall[0]).toEqual({ enabled: true, micEnabled: true });
  });

  it("fires a toast and resets the mic when micState=denied", async () => {
    useAgentSessionMock.mockReturnValue({
      ...defaultAgentSessionShape(),
      micState: MicState.Denied,
    });
    render(<OnboardingScreen />);

    await new Promise((r) => setTimeout(r, 0));
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/allow microphone/i),
    );
  });

  it("renders the StepIndicator with the onboarding labels", () => {
    render(<OnboardingScreen />);
    for (const label of ["Nickname", "Banks", "Balances", "Settings", "Done"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("fires router.push when redirectTarget is set by the system.redirect envelope", () => {
    useAgentSessionMock.mockReturnValue({
      ...defaultAgentSessionShape(),
      redirectTarget: "/dashboard",
    });

    render(<OnboardingScreen />);

    expect(routerPush).toHaveBeenCalledWith("/dashboard");
  });

  it("does NOT fire router.push when redirectTarget is null", () => {
    render(<OnboardingScreen />);
    expect(routerPush).not.toHaveBeenCalled();
  });
});
