import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import assistantProfileHooks, {
  ASSISTANT_PROFILE_QUERY_KEYS,
} from "@/hooks/useAssistantProfile";
import assistantProfileService from "@/services/assistantProfile.service";
import type {
  AssistantProfile,
  TtsVoice,
} from "@/services/interfaces/assistantProfile.interface";

vi.mock("@/services/assistantProfile.service", () => ({
  default: {
    getProfile: vi.fn(),
    listVoices: vi.fn(),
    previewVoice: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

const mockedService = vi.mocked(assistantProfileService);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );

  return { queryClient, Wrapper };
};

const PROFILE: AssistantProfile = {
  treatmentStyle: "informal",
  voiceId: "v-1",
  avatarUrl: "dicebear:notionists:felps",
};

const VOICES: TtsVoice[] = [
  { voiceId: "v-1", name: "Bella", language: "pt-BR" },
  { voiceId: "v-2", name: "Adam" },
];

describe("assistantProfileHooks.use()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("profile", () => {
    it("suspende até resolver e cacheia o profile na query key correta", async () => {
      mockedService.getProfile.mockResolvedValueOnce(PROFILE);
      mockedService.listVoices.mockResolvedValueOnce(VOICES);

      const { queryClient, Wrapper } = createWrapper();
      const { result } = renderHook(() => assistantProfileHooks.use(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current.profile.data).toEqual(PROFILE);
      expect(mockedService.getProfile).toHaveBeenCalledOnce();
      expect(
        queryClient.getQueryData(ASSISTANT_PROFILE_QUERY_KEYS.profile),
      ).toEqual(PROFILE);
    });
  });

  describe("voices", () => {
    it("suspende até resolver e cacheia a lista de vozes", async () => {
      mockedService.getProfile.mockResolvedValueOnce(PROFILE);
      mockedService.listVoices.mockResolvedValueOnce(VOICES);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => assistantProfileHooks.use(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current).not.toBeNull());
      expect(result.current.voices.data).toEqual(VOICES);
      expect(mockedService.listVoices).toHaveBeenCalledOnce();
    });
  });

  describe("previewVoice", () => {
    it("retorna Blob de áudio quando chamada", async () => {
      const blob = new Blob([new Uint8Array([1, 2])], { type: "audio/mpeg" });
      mockedService.getProfile.mockResolvedValueOnce(PROFILE);
      mockedService.listVoices.mockResolvedValueOnce(VOICES);
      mockedService.previewVoice.mockResolvedValueOnce(blob);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => assistantProfileHooks.use(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      let received: Blob | undefined;
      await act(async () => {
        received = await result.current.previewVoice.mutateAsync("v-1");
      });

      expect(mockedService.previewVoice).toHaveBeenCalledWith("v-1");
      expect(received).toBe(blob);
    });
  });

  describe("updateProfile", () => {
    it("invalida cache do profile no sucesso e atualiza query data", async () => {
      const updated: AssistantProfile = {
        ...PROFILE,
        treatmentStyle: "formal",
      };
      mockedService.getProfile.mockResolvedValueOnce(PROFILE);
      mockedService.listVoices.mockResolvedValueOnce(VOICES);
      mockedService.updateProfile.mockResolvedValueOnce(updated);

      const { queryClient, Wrapper } = createWrapper();
      const { result } = renderHook(() => assistantProfileHooks.use(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      await act(async () => {
        await result.current.updateProfile.mutateAsync({
          treatmentStyle: "formal",
        });
      });

      expect(mockedService.updateProfile).toHaveBeenCalledWith({
        treatmentStyle: "formal",
      });
      expect(
        queryClient.getQueryData(ASSISTANT_PROFILE_QUERY_KEYS.profile),
      ).toEqual(updated);
    });

    it("não atualiza cache quando updateProfile falha", async () => {
      mockedService.getProfile.mockResolvedValueOnce(PROFILE);
      mockedService.listVoices.mockResolvedValueOnce(VOICES);
      mockedService.updateProfile.mockRejectedValueOnce(new Error("400"));

      const { queryClient, Wrapper } = createWrapper();
      const { result } = renderHook(() => assistantProfileHooks.use(), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current).not.toBeNull());

      await act(async () => {
        await result.current.updateProfile
          .mutateAsync({ avatarUrl: "bad" })
          .catch(() => undefined);
      });

      expect(
        queryClient.getQueryData(ASSISTANT_PROFILE_QUERY_KEYS.profile),
      ).toEqual(PROFILE);
    });
  });
});
