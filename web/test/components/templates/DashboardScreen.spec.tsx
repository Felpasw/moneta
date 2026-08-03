import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardScreen } from "@/components/templates/DashboardScreen";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";
import { AgentSessionStatus, MicState } from "@/hooks/useAgentSession";
import {
  agentSessionActions,
  useAgentSessionStore,
} from "@/stores/agentSessionStore";

vi.mock("@/components/atoms/TalkingAssistantAvatar", () => ({
  TalkingAssistantAvatar: (props: {
    avatarUrl: string | null;
    audioElement: HTMLAudioElement | null;
    fallbackSeed?: string;
  }) => (
    <div
      data-testid="talking-assistant-avatar"
      data-avatar-url={props.avatarUrl ?? ""}
      data-audio-attached={props.audioElement ? "1" : "0"}
      data-fallback-seed={props.fallbackSeed ?? ""}
    />
  ),
}));

const profileDataMock = {
  data: {
    treatmentStyle: "informal" as const,
    voiceId: "v-1",
    avatarUrl: "dicebear:notionists:felps" as string | null,
  },
  isLoading: false,
  isError: false,
};

vi.mock("@/hooks/useAssistantProfile", () => ({
  default: {
    use: () => ({
      profile: profileDataMock,
      voices: { data: [], isLoading: false, isError: false },
      previewVoice: { mutateAsync: vi.fn() },
      updateProfile: { mutate: vi.fn(), isPending: false },
    }),
  },
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: Object.assign(
    (selector: (state: { user: unknown }) => unknown) =>
      selector({
        user: {
          id: "u-1",
          email: "felipe@moneta.com",
          name: "Felipe",
          onboardedAt: "2026-01-01",
        },
      }),
    { getState: () => ({ user: null }), setState: () => undefined },
  ),
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
    useAgentSession: (opts: { enabled: boolean }) => useAgentSessionMock(opts),
  };
});

afterEach(() => {
  useAgentSessionMock.mockClear();
  toastError.mockClear();
  agentSessionActions.resetAll();
});

describe("<DashboardScreen />", () => {
  it("abre a sessão do agente com mic desligado por default no store", () => {
    render(<DashboardScreen />);
    expect(useAgentSessionMock).toHaveBeenCalledWith({ enabled: true });
    expect(useAgentSessionStore.getState().micEnabled).toBe(false);
  });

  it("renderiza o TalkingAssistantAvatar (personagem do settings) + mic button", () => {
    render(<DashboardScreen />);
    const avatar = screen.getByTestId("talking-assistant-avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar.getAttribute("data-avatar-url")).toBe(
      "dicebear:notionists:felps",
    );
    expect(avatar.getAttribute("data-fallback-seed")).toBe("Felipe");
    expect(
      screen.getByRole("button", { name: /ligar mic/i }),
    ).toBeInTheDocument();
  });

  it("passa audioElement pro avatar quando a sessão tem áudio ativo", () => {
    const audio = document.createElement("audio");
    useAgentSessionMock.mockReturnValueOnce({
      status: AgentSessionStatus.Speaking,
      error: null,
      audioElement: audio,
      isWarming: false,
      micStream: null,
      micState: MicState.Off,
      toolEvents: [],
    });

    render(<DashboardScreen />);

    expect(
      screen.getByTestId("talking-assistant-avatar").getAttribute("data-audio-attached"),
    ).toBe("1");
  });

  it("clicar no MicButton alterna micEnabled no store", async () => {
    const user = userEvent.setup();
    render(<DashboardScreen />);

    expect(useAgentSessionStore.getState().micEnabled).toBe(false);

    await user.click(screen.getByRole("button", { name: /ligar mic/i }));

    expect(useAgentSessionStore.getState().micEnabled).toBe(true);
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

});
