import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@dicebear/core", () => {
  const createAvatar = vi.fn((_style: unknown, options: { seed?: string }) => {
    const seed = options?.seed ?? "";
    return {
      toDataUri: () => `data:image/svg+xml;utf8,<svg data-seed="${seed}"></svg>`,
      toString: () => `<svg data-seed="${seed}"></svg>`,
    };
  });
  return { createAvatar };
});

vi.mock("@/services/assistantProfile.service", () => ({
  default: {
    getProfile: vi.fn(),
    listVoices: vi.fn(),
    previewVoice: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
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

import assistantProfileService from "@/services/assistantProfile.service";
import { AssistantSettingsScreen } from "@/components/templates/AssistantSettingsScreen";

const mockedService = vi.mocked(assistantProfileService);

const PROFILE = {
  treatmentStyle: "informal" as const,
  voiceId: "v-1",
  avatarUrl: "dicebear:notionists:felps" as const,
};

const VOICES = [
  { voiceId: "v-1", name: "Bella", language: "pt-BR" },
  { voiceId: "v-2", name: "Adam", language: "en-US" },
];

const wrap = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
};

describe("AssistantSettingsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedService.getProfile.mockResolvedValue(PROFILE);
    mockedService.listVoices.mockResolvedValue(VOICES);
    mockedService.updateProfile.mockResolvedValue(PROFILE);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("mostra loading enquanto o profile/voices carregam", () => {
    mockedService.getProfile.mockReturnValueOnce(new Promise(() => {}));
    mockedService.listVoices.mockReturnValueOnce(new Promise(() => {}));

    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    expect(screen.getByRole("status", { name: /carregando/i })).toBeInTheDocument();
  });

  it("mostra erro quando o profile falha", async () => {
    mockedService.getProfile.mockRejectedValueOnce(new Error("500"));

    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/não foi possível carregar/i),
      ).toBeInTheDocument();
    });
  });

  it("renderiza 3 tabs (Tom, Voz, Avatar) e abre em Tom por default", async () => {
    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /tom/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: /voz/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /avatar/i })).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /tom de tratamento/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^voz$/i })).toBeNull();
    expect(screen.queryByRole("heading", { name: /^avatar$/i })).toBeNull();
  });

  it("troca de tab mostra a seção correspondente", async () => {
    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /voz/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("tab", { name: /voz/i }));
    expect(
      await screen.findByRole("heading", { name: /^voz$/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /avatar/i }));
    expect(
      await screen.findByRole("heading", { name: /^avatar$/i }),
    ).toBeInTheDocument();
  });

  it("mostra um hero com prévia do assistente no topo, refletindo o avatarUrl atual", async () => {
    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    const hero = await screen.findByRole("region", {
      name: /prévia do assistente/i,
    });
    expect(hero).toBeInTheDocument();
    const avatar = hero.querySelector("img");
    expect(avatar).not.toBeNull();
    expect(avatar?.getAttribute("alt")).toMatch(/notionists/i);
  });

  it("dispara updateProfile com treatmentStyle quando o radio muda", async () => {
    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: "Formal" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("radio", { name: "Formal" }));

    await waitFor(() => {
      expect(mockedService.updateProfile).toHaveBeenCalledWith({
        treatmentStyle: "formal",
      });
    });
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("dispara updateProfile com voiceId ao selecionar outra voz", async () => {
    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /voz/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("tab", { name: /voz/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /selecionar adam/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /selecionar adam/i }),
    );

    await waitFor(() => {
      expect(mockedService.updateProfile).toHaveBeenCalledWith({
        voiceId: "v-2",
      });
    });
  });

  it("dispara updateProfile com avatarUrl composto ao escolher um style", async () => {
    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /avatar/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("tab", { name: /avatar/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /escolher.*avataaars/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /escolher.*avataaars/i }),
    );

    await waitFor(() => {
      expect(mockedService.updateProfile).toHaveBeenCalledWith({
        avatarUrl: "dicebear:avataaars:felps",
      });
    });
  });

  it("mostra toast de erro quando updateProfile falha", async () => {
    mockedService.updateProfile.mockRejectedValueOnce(new Error("400"));

    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: "Formal" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("radio", { name: "Formal" }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
  });
});
