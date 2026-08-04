import api from "@/api";

import type {
  AssistantProfile,
  IAssistantProfileService,
  ListVoicesResponse,
  TtsVoice,
  UpdateProfilePatch,
} from "./interfaces/assistantProfile.interface";

class AssistantProfileService implements IAssistantProfileService {
  async getProfile(): Promise<AssistantProfile> {
    const { data } = await api.get<AssistantProfile>("/agent/profile");

    return data;
  }

  async listVoices(): Promise<TtsVoice[]> {
    const { data } = await api.get<ListVoicesResponse>("/agent/voices");

    return data.voices;
  }

  async previewVoice(voiceId: string): Promise<Blob> {
    const { data } = await api.post<ArrayBuffer>(
      `/agent/voices/${voiceId}/preview`,
      {},
      { responseType: "arraybuffer" },
    );

    return new Blob([data], { type: "audio/mpeg" });
  }

  async updateProfile(patch: UpdateProfilePatch): Promise<AssistantProfile> {
    const { data } = await api.patch<AssistantProfile>("/agent/profile", patch);

    return data;
  }
}

const assistantProfileService = new AssistantProfileService();

export default assistantProfileService;
