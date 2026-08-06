import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, type ReactNode } from "react";
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
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div data-testid="suspense-fallback" />}>
        {children}
      </Suspense>
    </QueryClientProvider>
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

  it("renderiza 3 tabs (Tone, Voice, Avatar) e abre em Tone por default", async () => {
    const { Wrapper } = wrap();
    render(
      <Wrapper>
        <AssistantSettingsScreen />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /tone/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: /voice/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /avatar/i })).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /speaking tone/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^voice$/i })).toBeNull();
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
      expect(screen.getByRole("tab", { name: /voice/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("tab", { name: /voice/i }));
    expect(
      await screen.findByRole("heading", { name: /^voice$/i }),
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
      name: /assistant preview/i,
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
      expect(screen.getByRole("tab", { name: /voice/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("tab", { name: /voice/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /select adam/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /select adam/i }),
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
        screen.getByRole("button", { name: /choose.*avataaars/i }),
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /choose.*avataaars/i }),
    );

    await waitFor(() => {
      expect(mockedService.updateProfile).toHaveBeenCalledWith({
        avatarUrl: "dicebear:avataaars:cuzi",
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
