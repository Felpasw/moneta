import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";

import assistantProfileService from "@/services/assistantProfile.service";

vi.mock("@/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPatch = vi.mocked(api.patch);
const mockedPost = vi.mocked(api.post);

describe("assistantProfileService", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("GETs /agent/profile e retorna payload", async () => {
      const payload = {
        treatmentStyle: "informal",
        voiceId: "v-1",
        avatarUrl: "dicebear:notionists:felps",
      };
      mockedGet.mockResolvedValueOnce({ data: payload });

      const result = await assistantProfileService.getProfile();

      expect(mockedGet).toHaveBeenCalledWith("/agent/profile");
      expect(result).toEqual(payload);
    });
  });

  describe("listVoices", () => {
    it("GETs /agent/voices e retorna array de vozes", async () => {
      const payload = {
        voices: [
          { voiceId: "v-1", name: "Bella", language: "pt-BR" },
          { voiceId: "v-2", name: "Adam" },
        ],
      };
      mockedGet.mockResolvedValueOnce({ data: payload });

      const result = await assistantProfileService.listVoices();

      expect(mockedGet).toHaveBeenCalledWith("/agent/voices");
      expect(result).toEqual(payload.voices);
    });
  });

  describe("previewVoice", () => {
    it("POSTs em /agent/voices/:id/preview com responseType arraybuffer e retorna Blob audio/mpeg", async () => {
      const arrayBuffer = new Uint8Array([1, 2, 3]).buffer;
      mockedPost.mockResolvedValueOnce({ data: arrayBuffer });

      const result = await assistantProfileService.previewVoice("v-1");

      expect(mockedPost).toHaveBeenCalledWith(
        "/agent/voices/v-1/preview",
        {},
        { responseType: "arraybuffer" },
      );
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("audio/mpeg");
    });
  });

  describe("updateProfile", () => {
    it("PATCHes /agent/profile com o patch e retorna profile atualizado", async () => {
      const patch = {
        treatmentStyle: "formal" as const,
        avatarUrl: "dicebear:avataaars:felps",
      };
      const payload = {
        treatmentStyle: "formal",
        voiceId: "v-1",
        avatarUrl: "dicebear:avataaars:felps",
      };
      mockedPatch.mockResolvedValueOnce({ data: payload });

      const result = await assistantProfileService.updateProfile(patch);

      expect(mockedPatch).toHaveBeenCalledWith("/agent/profile", patch);
      expect(result).toEqual(payload);
    });

    it("propaga o erro do axios", async () => {
      const error = { response: { status: 400, data: { message: "invalid" } } };
      mockedPatch.mockRejectedValueOnce(error);

      await expect(
        assistantProfileService.updateProfile({ avatarUrl: "bad" }),
      ).rejects.toBe(error);
    });
  });
});
